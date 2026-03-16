-- ModernCMS Database Schema
-- Run this in your Supabase SQL editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',           -- primary display name (used by app)
  display_name TEXT,                       -- optional alternative display name
  first_name TEXT,
  last_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  role TEXT NOT NULL DEFAULT 'subscriber'
    CHECK (role IN ('administrator','editor','author','contributor','subscriber')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator')
);
CREATE POLICY "Admins can update all users" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator')
);

-- ============================================================
-- OPTIONS (site settings)
-- ============================================================
CREATE TABLE public.options (
  id BIGSERIAL PRIMARY KEY,
  option_key TEXT UNIQUE NOT NULL,
  option_value TEXT,
  autoload BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read options" ON public.options FOR SELECT USING (true);
CREATE POLICY "Admins can manage options" ON public.options FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator')
);

-- Insert default options
INSERT INTO public.options (option_key, option_value) VALUES
  ('siteTitle', 'ModernCMS'),
  ('siteTagline', 'Just another ModernCMS site'),
  ('siteUrl', 'http://localhost:3000'),
  ('adminEmail', 'admin@example.com'),
  ('postsPerPage', '10'),
  ('showOnFront', 'posts'),
  ('frontPage', ''),
  ('dateFormat', 'MMMM d, yyyy'),
  ('timeFormat', 'h:mm a'),
  ('timezone', 'UTC'),
  ('defaultCategory', '1'),
  ('permalinkStructure', '/%postname%/'),
  ('activeTheme', 'default'),
  ('commentModeration', 'true'),
  ('threadedComments', 'true'),
  ('maxCommentDepth', '5');

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Editors+ can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator','editor'))
);

INSERT INTO public.categories (name, slug, description) VALUES
  ('Uncategorized', 'uncategorized', 'Default category');

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE public.tags (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Authors+ can manage tags" ON public.tags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator','editor','author'))
);

-- ============================================================
-- POSTS
-- ============================================================
CREATE TABLE public.posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  slug TEXT UNIQUE,
  content_json JSONB,
  content_html TEXT,
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','pending','private','trash','scheduled')),
  type TEXT NOT NULL DEFAULT 'post'       -- renamed from post_type for simplicity
    CHECK (type IN ('post','page','custom')),
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  parent_id BIGINT REFERENCES public.posts(id) ON DELETE SET NULL,
  featured_image TEXT,
  template TEXT DEFAULT 'default',
  is_featured BOOLEAN DEFAULT FALSE,
  page_order INTEGER DEFAULT 0,
  comment_status TEXT DEFAULT 'open' CHECK (comment_status IN ('open','closed')),
  comment_count INTEGER DEFAULT 0,
  password TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public','private','password')),
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search vector
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content_html,''))
  ) STORED
);

CREATE INDEX idx_posts_slug ON public.posts(slug);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_type ON public.posts(type);
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_search ON public.posts USING gin(search_vector);
CREATE INDEX idx_posts_published ON public.posts(published_at DESC);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published posts" ON public.posts FOR SELECT USING (status = 'published');
CREATE POLICY "Authors can manage own posts" ON public.posts FOR ALL USING (author_id = auth.uid());
CREATE POLICY "Editors+ can manage all posts" ON public.posts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator','editor'))
);

-- ============================================================
-- POST META
-- ============================================================
CREATE TABLE public.post_meta (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  meta_key TEXT NOT NULL,
  meta_value TEXT,
  UNIQUE(post_id, meta_key)
);

ALTER TABLE public.post_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Post meta follows post access" ON public.post_meta FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND status = 'publish')
);
CREATE POLICY "Authors can manage own post meta" ON public.post_meta FOR ALL USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = auth.uid())
);

-- ============================================================
-- REVISIONS
-- ============================================================
CREATE TABLE public.revisions (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  title TEXT,
  content_json JSONB,
  content_html TEXT,
  revised_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  revised_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authors can see own revisions" ON public.revisions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = auth.uid())
);
CREATE POLICY "Editors+ can see all revisions" ON public.revisions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator','editor'))
);

-- ============================================================
-- POST TAXONOMIES (many-to-many)
-- ============================================================
CREATE TABLE public.post_categories (
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

CREATE TABLE public.post_tags (
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read post_categories" ON public.post_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read post_tags" ON public.post_tags FOR SELECT USING (true);
CREATE POLICY "Authors can manage own post categories" ON public.post_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = auth.uid())
);
CREATE POLICY "Authors can manage own post tags" ON public.post_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = auth.uid())
);

-- ============================================================
-- MEDIA
-- ============================================================
CREATE TABLE public.media (
  id BIGSERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_type TEXT,
  mime_type TEXT,
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read media" ON public.media FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload media" ON public.media FOR INSERT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own media" ON public.media FOR DELETE USING (uploaded_by = auth.uid());
CREATE POLICY "Admins can manage all media" ON public.media FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator','editor'))
);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE public.comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_url TEXT,
  author_ip TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('approved','pending','spam','trash')),
  parent_id BIGINT REFERENCES public.comments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON public.comments(post_id);
CREATE INDEX idx_comments_status ON public.comments(status);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved comments" ON public.comments FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can submit a comment" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all comments" ON public.comments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator','editor'))
);

-- ============================================================
-- MENUS
-- ============================================================
CREATE TABLE public.menus (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  location TEXT CHECK (location IN ('primary','footer','sidebar','footer2')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.menu_items (
  id BIGSERIAL PRIMARY KEY,
  menu_id BIGINT NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  target TEXT DEFAULT '_self',
  icon TEXT,
  parent_id BIGINT REFERENCES public.menu_items(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  item_type TEXT DEFAULT 'custom' CHECK (item_type IN ('custom','page','post','category','tag')),
  object_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read menus" ON public.menus FOR SELECT USING (true);
CREATE POLICY "Anyone can read menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage menus" ON public.menus FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator','editor'))
);
CREATE POLICY "Admins can manage menu items" ON public.menu_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator','editor'))
);

-- ============================================================
-- WIDGETS
-- ============================================================
CREATE TABLE public.widgets (
  id BIGSERIAL PRIMARY KEY,
  widget_type TEXT NOT NULL,
  title TEXT,
  content JSONB,
  sidebar_location TEXT NOT NULL DEFAULT 'sidebar'
    CHECK (sidebar_location IN ('sidebar','footer1','footer2')),
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read widgets" ON public.widgets FOR SELECT USING (true);
CREATE POLICY "Admins can manage widgets" ON public.widgets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator','editor'))
);

-- ============================================================
-- PLUGINS
-- ============================================================
CREATE TABLE public.plugins (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  author TEXT,
  author_url TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  settings_json JSONB DEFAULT '{}',
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage plugins" ON public.plugins FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator')
);
CREATE POLICY "Anyone can read active plugins" ON public.plugins FOR SELECT USING (is_active = true);

-- Insert sample plugins
INSERT INTO public.plugins (name, slug, description, version, author, is_active) VALUES
  ('SEO Optimizer', 'seo-optimizer', 'Optimize your site for search engines with meta tags, sitemaps, and more.', '2.1.0', 'ModernCMS Team', true),
  ('Contact Form', 'contact-form', 'Add beautiful contact forms to any page with spam protection.', '1.5.2', 'ModernCMS Team', true),
  ('Backup Manager', 'backup-manager', 'Automated database and file backups to cloud storage.', '1.0.1', 'ModernCMS Team', false),
  ('Security Scanner', 'security-scanner', 'Scan for malware, monitor logins, and protect your site.', '3.0.0', 'ModernCMS Team', false),
  ('Analytics Dashboard', 'analytics-dashboard', 'Track visitors, page views, and engagement metrics.', '1.2.0', 'ModernCMS Team', false),
  ('WooStore', 'woostore', 'Full e-commerce functionality with products, cart, and checkout.', '4.0.0', 'ModernCMS Team', false);

-- ============================================================
-- TRIGGER: update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_comments_updated BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_options_updated BEFORE UPDATE ON public.options FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: auto-create user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: update post comment count
-- ============================================================
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
      UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
      UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_count
  AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard or via API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
-- CREATE POLICY "Anyone can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
-- CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- SAMPLE DATA
-- ============================================================
-- Note: Create a user via Supabase Auth first, then run:
-- INSERT INTO public.posts (title, slug, content_html, status, post_type) VALUES
--   ('Hello World', 'hello-world', '<p>Welcome to ModernCMS! This is your first post.</p>', 'publish', 'post'),
--   ('Sample Page', 'sample-page', '<p>This is a sample page.</p>', 'publish', 'page');

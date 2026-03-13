const fs = require('fs');
const files = [
  'app/admin/plugins/page.js',
  'app/admin/tools/page.js',
  'app/admin/users/page.js',
  'app/admin/users/[id]/page.js',
  'app/admin/settings/page.js',
  'app/admin/comments/page.js',
  'app/admin/appearance/themes/page.js',
  'app/admin/appearance/widgets/page.js',
  'app/admin/appearance/menus/page.js',
  'app/admin/appearance/customizer/page.js',
  'components/MediaPicker.js'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace("import { createClient } from '@/lib/supabase';", "import { supabase } from '@/lib/supabase';");
    content = content.replace("const supabase = createClient();", "");
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  } else {
    console.log('Not found ' + file);
  }
});

export const ROLES = {
  ADMINISTRATOR: 'administrator',
  EDITOR: 'editor',
  AUTHOR: 'author',
  CONTRIBUTOR: 'contributor',
  SUBSCRIBER: 'subscriber',
}

export const ROLE_HIERARCHY = {
  administrator: 5,
  editor: 4,
  author: 3,
  contributor: 2,
  subscriber: 1,
}

export const CAPABILITIES = {
  administrator: [
    'manage_options', 'manage_users', 'manage_plugins', 'manage_themes',
    'publish_posts', 'edit_posts', 'delete_posts', 'edit_others_posts',
    'delete_others_posts', 'publish_pages', 'edit_pages', 'delete_pages',
    'manage_categories', 'moderate_comments', 'upload_files',
    'edit_private_posts', 'read_private_posts', 'install_plugins',
    'activate_plugins', 'update_core',
  ],
  editor: [
    'publish_posts', 'edit_posts', 'delete_posts', 'edit_others_posts',
    'delete_others_posts', 'publish_pages', 'edit_pages', 'delete_pages',
    'manage_categories', 'moderate_comments', 'upload_files',
    'edit_private_posts', 'read_private_posts',
  ],
  author: [
    'publish_posts', 'edit_posts', 'delete_posts', 'upload_files',
  ],
  contributor: [
    'edit_posts', 'delete_posts',
  ],
  subscriber: [
    'read',
  ],
}

export function hasCapability(role, capability) {
  return CAPABILITIES[role]?.includes(capability) ?? false
}

export function hasRole(userRole, requiredRole) {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 999)
}

export function getRoleLabel(role) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unknown'
}

export const ROLE_OPTIONS = Object.values(ROLES).map(r => ({
  value: r,
  label: getRoleLabel(r),
}))

const actions = {}
const filters = {}

export function addAction(hook, callback, priority = 10) {
  if (!actions[hook]) actions[hook] = []
  actions[hook].push({ callback, priority })
  actions[hook].sort((a, b) => a.priority - b.priority)
}

export function doAction(hook, ...args) {
  if (!actions[hook]) return
  for (const { callback } of actions[hook]) {
    callback(...args)
  }
}

export function addFilter(hook, callback, priority = 10) {
  if (!filters[hook]) filters[hook] = []
  filters[hook].push({ callback, priority })
  filters[hook].sort((a, b) => a.priority - b.priority)
}

export function applyFilters(hook, value, ...args) {
  if (!filters[hook]) return value
  let result = value
  for (const { callback } of filters[hook]) {
    result = callback(result, ...args)
  }
  return result
}

const registeredPlugins = {}

export function registerPlugin(slug, config) {
  registeredPlugins[slug] = { ...config, slug, isActive: false }
}

export function activatePlugin(slug) {
  if (registeredPlugins[slug]) {
    registeredPlugins[slug].isActive = true
    doAction(`plugin_activated_${slug}`)
  }
}

export function deactivatePlugin(slug) {
  if (registeredPlugins[slug]) {
    registeredPlugins[slug].isActive = false
    doAction(`plugin_deactivated_${slug}`)
  }
}

export function getPlugins() {
  return Object.values(registeredPlugins)
}

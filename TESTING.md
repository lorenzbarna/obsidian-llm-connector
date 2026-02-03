# LLM Connector - Testing Guide

## Plugin Location

The plugin is now correctly located at:
```
/home/lorenz/Documents/91_Obsidian/plugin_dev/.obsidian/plugins/llm-connector/
```

This is the standard Obsidian plugin location: `<vault>/.obsidian/plugins/<plugin-id>/`

## Development Workflow

### 1. Build the Plugin

```bash
cd .obsidian/plugins/llm-connector

# First time setup
npm install

# Development (watch mode - auto rebuilds on file changes)
npm run dev

# Production build (with type checking)
npm run build
```

### 2. Enable in Obsidian

1. Open Obsidian with this vault (`plugin_dev`)
2. Go to **Settings → Community plugins**
3. Make sure "Safe mode" is OFF
4. Click "Reload plugins" or restart Obsidian
5. Find "LLM Connector" in the plugin list
6. Toggle it ON

### 3. Test Changes

After making code changes:

**If using `npm run dev` (watch mode):**
- Changes are auto-compiled to `main.js`
- Reload Obsidian: **Ctrl+R** (or Cmd+R on Mac)
- Check the developer console: **Ctrl+Shift+I** (or Cmd+Opt+I on Mac)

**If building manually:**
- Run `npm run build` 
- Reload Obsidian: **Ctrl+R**
- Check console for errors

### 4. Debugging

Open the developer console (**Ctrl+Shift+I**) to see:
- `console.log()` output
- Errors and stack traces
- Network requests (if making API calls)

The plugin logs:
- "Loading LLM Connector Plugin" on load
- "Unloading LLM Connector Plugin" on unload

### 5. Required Files for Plugin to Work

Obsidian needs these files in `.obsidian/plugins/llm-connector/`:
- ✅ `main.js` (compiled output from TypeScript)
- ✅ `manifest.json` (plugin metadata)
- ✅ `styles.css` (optional - for custom styling)

These are automatically created by the build process.

## Common Issues

**Plugin doesn't appear in settings:**
- Ensure `manifest.json` is in the correct location
- Check that `id` in manifest.json matches folder name (`llm-connector`)
- Restart Obsidian completely

**Plugin fails to load:**
- Run `npm run build` to compile TypeScript
- Check for TypeScript errors
- Look in developer console for error messages
- Verify `main.js` exists

**Changes not showing:**
- Reload Obsidian with **Ctrl+R**
- If using `npm run dev`, verify it's still running
- Check if `main.js` was updated (file timestamp)

**TypeScript errors:**
- Run `npm run lint` to check for issues
- Fix any strict mode violations
- Ensure all imports are correct

## File Watching (Recommended for Development)

Run in a separate terminal:
```bash
cd .obsidian/plugins/llm-connector
npm run dev
```

This will:
- Watch for file changes in `src/`
- Auto-compile to `main.js`
- Show compilation errors immediately

Then just reload Obsidian (**Ctrl+R**) to test changes.

## Git Workflow

The git repository is inside the plugin folder:
```bash
cd .obsidian/plugins/llm-connector
git status
git add .
git commit -m "feat: add new feature"
```

## Testing with Other Plugins

When testing the public API with consumer plugins (like Contacts Plus):

1. Ensure LLM Connector is loaded first
2. Check API is exposed: `app.plugins.plugins['llm-connector'].api`
3. Test graceful degradation when LLM Connector is disabled
4. Check console for API version: should log on load

## Next Steps

After completing a feature:
- [ ] Run `npm run build` - must pass with zero errors
- [ ] Run `npm run lint` - must pass with zero errors
- [ ] Test in Obsidian vault
- [ ] Check console for errors
- [ ] Update DEVLOG.md with changes
- [ ] Commit changes to git

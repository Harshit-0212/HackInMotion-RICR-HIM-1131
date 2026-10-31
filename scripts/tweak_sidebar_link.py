with open("project-bolt-sb1-jmtrfrhu/project/frontend/src/components/layout/AppLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Update SidebarLink padding to px-3.5 py-2.5 rounded-xl
old_link = 'className={({ isActive }) =>\n        `group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-bold transition-all duration-300 border ${'
new_link = 'className={({ isActive }) =>\n        `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 border ${'

if old_link in content:
    content = content.replace(old_link, new_link)
    print("SidebarLink classes updated successfully")
else:
    print("SidebarLink pattern not found")

with open("project-bolt-sb1-jmtrfrhu/project/frontend/src/components/layout/AppLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)


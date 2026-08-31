# Drop new photos here

Claude Code cannot read ~/Downloads on this machine — macOS privacy protection
blocks it (System Settings → Privacy & Security → Files and Folders).

Rather than change that setting, just move the files here. From your own
Terminal, which does have the permission:

    mv ~/Downloads/pexels-*.jpg ~/darija-tetouan/assets/photos/incoming/

Or drag them into this folder in Finder.

Anything in this folder is ignored by git until it has been identified,
optimised and given a real name in assets/photos/.

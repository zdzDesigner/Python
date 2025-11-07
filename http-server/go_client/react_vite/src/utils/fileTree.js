/**
 * Converts a flat list of file paths into a hierarchical tree structure.
 * 
 * @param {Array<Object>} files - A list of file objects, each with a 'Name' property (e.g., 'folder/file.mp3').
 * @returns {Object} The root node of the file tree.
 */
export const buildFileTree = (files) => {
  const root = { name: 'Audio Files', type: 'folder', children: [] };

  if (!files) {
    return root;
  }

  files.forEach(file => {
    const pathParts = file.Name.split('/');
    let currentLevel = root.children;

    pathParts.forEach((part, index) => {
      const isFile = index === pathParts.length - 1;
      let existingPart = currentLevel.find(item => item.name === part && item.type === (isFile ? 'file' : 'folder'));

      if (!existingPart) {
        if (isFile) {
          existingPart = { name: part, type: 'file', data: file };
        } else {
          existingPart = { name: part, type: 'folder', children: [] };
        }
        currentLevel.push(existingPart);
      }

      if (!isFile && existingPart.type === 'folder') {
        currentLevel = existingPart.children;
      }
    });
  });

  return root;
};

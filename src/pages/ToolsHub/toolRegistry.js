import { lazy } from 'react';

const toolModules = import.meta.glob('../../modules/Tools/*/index.jsx');

const formatToolName = (folderName) => folderName
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[-_]+/g, ' ')
  .trim()
  .split(/\s+/)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const toolModulesInDisplayOrder = Object.entries(toolModules).sort(([firstPath], [secondPath]) => {
  const firstId = firstPath.split('/').slice(-2, -1)[0];
  const secondId = secondPath.split('/').slice(-2, -1)[0];
  if (firstId === 'VocabularyPractice') return -1;
  if (secondId === 'VocabularyPractice') return 1;
  return firstId.localeCompare(secondId);
});

export const toolEntries = toolModulesInDisplayOrder.map(([path, importer]) => {
  const id = path.split('/').slice(-2, -1)[0];
  const title = id === 'ImageArtStudio'
    ? 'Image → ASCII Studio'
    : formatToolName(id);

  return {
    id,
    title,
    Component: lazy(async () => {
      const module = await importer();
      return { default: module.default?.tool?.Component || module.default };
    }),
  };
});
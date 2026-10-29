# Tool modules

Create one folder per tool under this directory. The folder name becomes the card title, and each tool folder must contain an `index.jsx` file.

The default export is rendered inside the tool dialog when its card is opened. Optional subfolders can hold that tool's components, hooks, and utilities.

```jsx
export default function ExampleTool() {
  return <div>Tool interface</div>;
}
```
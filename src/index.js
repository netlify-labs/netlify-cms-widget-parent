import { ParentControl as Control, ParentPreview as Preview } from './ParentWidget';

if (typeof window !== 'undefined') {
  window.NetlifyCmsWidgetParent = { control: Control, preview: Preview };
}

export { Control, Preview };

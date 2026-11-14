import { unstableSetRender } from 'antd-mobile';
import { createRoot, type Root } from 'react-dom/client';

// Official antd-mobile React 19 adapter for Toast and Dialog roots.
const roots = new WeakMap<Element | DocumentFragment, Root>();
unstableSetRender((node, container) => {
  let root = roots.get(container);
  if (!root) { root = createRoot(container); roots.set(container, root); }
  root.render(node);
  return async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    root.unmount();
    roots.delete(container);
  };
});

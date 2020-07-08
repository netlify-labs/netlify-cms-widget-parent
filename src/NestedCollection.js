import React from 'react';
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import { dirname, sep } from 'path';
import { colors, components } from 'netlify-cms-ui-default/dist/esm/styles';
import Icon from 'netlify-cms-ui-default/dist/esm/Icon';

const NodeTitleContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const NodeTitle = styled.div`
  margin-right: 4px;
`;

const Caret = styled.div`
  position: relative;
  top: 2px;
`;

const CaretDown = styled(Caret)`
  ${components.caretDown};
  color: currentColor;
`;

const CaretRight = styled(Caret)`
  ${components.caretRight};
  color: currentColor;
  left: 2px;
`;

const selectedStyle = (props) =>
  props.selected === true
    ? css`
        color: ${colors.active};
        background-color: ${colors.activeBackground};
        border-left-color: #4863c6;
      `
    : css``;

const TreeNavLink = styled.div`
  display: flex;
  font-size: 14px;
  font-weight: 500;
  align-items: center;
  padding: 8px;
  padding-left: ${(props) => props.depth * 20 + 12}px;
  border-left: 2px solid #fff;

  ${Icon} {
    margin-right: 8px;
    flex-shrink: 0;
  }

  ${selectedStyle}

  ${(props) => css`
    &:hover,
    &:active,
    &.${props.activeClassName} {
      color: ${colors.active};
      background-color: ${colors.activeBackground};
      border-left-color: #4863c6;
    }
  `};
`;

const getNodeTitle = (node) => {
  const title = node.children.find((c) => !c.isDir && c.title)?.title || node.title;
  return title;
};

const TreeNode = (props) => {
  const { collection, treeData, depth = 0, onToggle } = props;

  const sortedData = [...treeData];
  sortedData.sort((a, b) => {
    const title1 = getNodeTitle(a);
    const title2 = getNodeTitle(b);
    return title1.localeCompare(title2);
  });

  return sortedData.map((node) => {
    if (!node.isDir) {
      return null;
    }

    const title = getNodeTitle(node);

    const hasChildren = depth === 0 || node.children.some((c) => c.isDir);
    return (
      <React.Fragment key={node.path}>
        <TreeNavLink
          activeClassName="parent-node-active"
          onClick={(e) => {
            e.stopPropagation();
            onToggle({ node, expanded: !node.expanded });
          }}
          depth={depth}
          selected={node.selected}
        >
          <Icon type="write" size="small" />
          <NodeTitleContainer>
            <NodeTitle>{title}</NodeTitle>
            {hasChildren && (node.expanded ? <CaretDown /> : <CaretRight />)}
          </NodeTitleContainer>
        </TreeNavLink>
        {node.expanded && (
          <TreeNode
            collection={collection}
            depth={depth + 1}
            treeData={node.children}
            onToggle={onToggle}
          />
        )}
      </React.Fragment>
    );
  });
};

export const getTreeData = (collection, entries, selected) => {
  const collectionFolder = collection.get('folder');
  const rootFolder = '/';
  const entriesObj = entries.map((e) => ({
    ...e,
    path: e.path.substring(collectionFolder.length),
  }));

  const dirs = entriesObj.reduce((acc, entry) => {
    let dir = dirname(entry.path);
    while (!acc[dir] && dir && dir !== rootFolder) {
      const parts = dir.split(sep);
      acc[dir] = parts.pop();
      dir = parts.length && parts.join(sep);
    }
    return acc;
  }, {});

  const flatData = [
    {
      title: collection.get('label'),
      path: rootFolder,
      isDir: true,
      isRoot: true,
    },
    ...Object.entries(dirs).map(([key, value]) => ({
      title: value,
      path: key,
      isDir: true,
      isRoot: false,
    })),
    ...entriesObj.map((e) => {
      return {
        ...e,
        title: e.data.title,
        isDir: false,
        isRoot: false,
      };
    }),
  ];

  const parentsToChildren = flatData.reduce((acc, node) => {
    const parent = node.path === rootFolder ? '' : dirname(node.path);
    if (acc[parent]) {
      acc[parent].push(node);
    } else {
      acc[parent] = [node];
    }
    return acc;
  }, {});

  const reducer = (acc, value) => {
    const node = value;
    let children = [];
    if (parentsToChildren[node.path]) {
      children = parentsToChildren[node.path].reduce(reducer, []);
    }

    acc.push({
      ...node,
      expanded: selected.startsWith(node.path),
      selected: selected === node.path,
      children,
    });
    return acc;
  };

  const treeData = parentsToChildren[''].reduce(reducer, []);

  return treeData;
};

const walk = (treeData, callback) => {
  const traverse = (children) => {
    for (const child of children) {
      callback(child);
      traverse(child.children);
    }
  };

  return traverse(treeData);
};

export class NestedCollection extends React.Component {
  constructor(props) {
    super(props);
    const selected = `/${this.props.selected}`;
    this.state = {
      treeData: getTreeData(this.props.collection, this.props.entries, selected),
    };
  }

  onToggle({ node, expanded }) {
    const newData = [...this.state.treeData];
    walk(newData, (n) => {
      if (n.path === node.path) {
        if (n.selected || !n.expanded) {
          n.expanded = expanded;
        }
      }
      n.selected = n.path == node.path;
    });
    this.setState({ treeData: newData });
    this.props.onSelectNode(node.path);
  }

  render() {
    const { treeData } = this.state;
    const { collection } = this.props;

    return (
      <TreeNode
        collection={collection}
        treeData={treeData}
        onToggle={({ node, expanded }) => this.onToggle({ node, expanded })}
      />
    );
  }
}

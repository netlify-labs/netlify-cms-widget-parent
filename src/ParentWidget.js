import React from 'react';
import Select from 'react-select';
import { reactSelectStyles } from 'netlify-cms-ui-default/dist/esm/styles';
import { NestedCollection } from './NestedCollection';

const trimStart = (str, prefix) => {
  return str.substring(prefix.length);
};

const getPath = (path, collectionFolder) => {
  const p = path.split('/').slice(0, -1).join('/');
  return trimStart(p, collectionFolder);
};

const getParent = (path, collectionFolder) => {
  const parent = path.split('/').slice(0, -2).join('/');
  return trimStart(parent, collectionFolder);
};

const getFullPath = (value, collectionFolder, indexFile) => {
  return `${collectionFolder}/${value}/${indexFile}.md`;
};

const getFolder = (path) => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

const Option = (props) => {
  const { innerProps, options } = props;
  const option = options[0];
  const { collection, entries, value, onSelectNode } = option;
  return (
    <div {...innerProps}>
      <NestedCollection
        collection={collection}
        entries={entries}
        selected={value}
        onSelectNode={(value) => onSelectNode(value.substring(1))}
      />
    </div>
  );
};

export class ParentControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = { entries: [], title: '' };
    this.selectRef = React.createRef();
  }

  handleChange(newParent) {
    const value = this.getValue();
    let folder;
    if (this.isNewRecord()) {
      const title = this.state.title;
      folder = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    } else {
      folder = getFolder(value);
    }
    const newPath = newParent === '/' ? `${folder}` : `${newParent}/${folder}`;
    this.props.onChange(newPath);
  }

  getValue() {
    return this.props.value || '';
  }

  isNewRecord() {
    return this.props.entry.get('newRecord');
  }

  getPath(path) {
    const { collection } = this.props;
    const collectionFolder = collection.get('folder') + '/';
    const parent = getPath(path, collectionFolder);
    return parent;
  }

  getFullPath() {
    const { collection, field } = this.props;
    const collectionFolder = collection.get('folder');
    const value = this.getValue();
    const fullPath = getFullPath(value, collectionFolder, field.get('index_file'));
    return fullPath;
  }

  getParent(path) {
    const { collection } = this.props;
    const collectionFolder = collection.get('folder') + '/';
    const parent = getParent(path, collectionFolder);
    return parent;
  }

  async componentDidMount() {
    const { forID, query, collection } = this.props;

    const collectionName = collection.get('name');

    const {
      payload: {
        response: { hits = [] },
      },
    } = await query(forID, collectionName, ['path'], '');

    this.setState({
      entries: hits,
    });

    if (this.isNewRecord()) {
      this.props.onChange(this.getValue() + '/');
      // track title field so we can use it for the folder name
      const titleInput = document.querySelector('[id*=title-field]');
      titleInput.addEventListener('input', (e) => {
        const title = e.target.value;
        this.setState({ title });
        const parent = this.selectRef.current.props.options[0].value;
        this.handleChange(parent);
      });
    }
  }

  render() {
    const { forID, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;

    const fullPath = this.getFullPath();
    const parentPath = this.getParent(fullPath) || '';
    const parent = this.state.entries.find((e) => this.getPath(e.path) === parentPath);
    const label = (parent && parent.data.title) || '';

    const options = [
      {
        value: parentPath,
        label,
        collection: this.props.collection,
        entries: this.state.entries,
        onSelectNode: (value) => this.handleChange(value),
      },
    ];

    return (
      <Select
        value={options[0]}
        inputId={forID}
        options={options}
        className={classNameWrapper}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        styles={reactSelectStyles}
        components={{
          Option,
        }}
        ref={this.selectRef}
      />
    );
  }
}

export class ParentPreview extends React.Component {
  constructor(props) {
    super(props);
  }

  getFullPath() {
    const { field } = this.props;
    const value = this.props.value || '';
    if (value === '/') {
      return `<title>/${field.get('index_file')}.md`;
    } else if (value.endsWith('/')) {
      return `${value + '<title>'}/${field.get('index_file')}.md`;
    } else {
      return `${value}/${field.get('index_file')}.md`;
    }
  }

  render() {
    return (
      <div className="text">
        <p>{'File Path: ' + this.getFullPath()}</p>
      </div>
    );
  }
}

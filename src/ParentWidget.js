import React from 'react';
import AsyncSelect from 'react-select/async';
import { reactSelectStyles } from 'netlify-cms-ui-default/dist/esm/styles';
import { NestedCollection } from './NestedCollection';
import slugify from 'slugify';

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

export const sanitizePath = (path) => {
  const replacement = '-';
  const sanitizedPath = slugify(path.toLowerCase(), replacement);

  // Remove any doubled or leading/trailing replacement characters (that were added in the sanitizers).
  const doubleReplacement = new RegExp(`(?:${replacement})+`, 'g');
  const trailingReplacement = new RegExp(`${replacement}$`);
  const leadingReplacement = new RegExp(`^${replacement}`);

  const normalizedPath = sanitizedPath
    .replace(doubleReplacement, replacement)
    .replace(leadingReplacement, '')
    .replace(trailingReplacement, '');

  return normalizedPath;
};

export class ParentControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = { title: '', optionsLoaded: false, options: [] };
    this.selectRef = React.createRef();
  }

  handleChange(newParent) {
    const value = this.getValue();
    let folder;
    if (this.isNewRecord()) {
      const title = this.state.title;
      folder = sanitizePath(title);
    } else {
      folder = getFolder(value);
    }
    const newPath = newParent === '/' ? `${folder}` : `${newParent}/${folder}`;
    this.props.onChange(newPath);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value && this.state.optionsLoaded) {
      // update options with the new parent
      this.setState({
        options: this.getOptions(this.state.options[0].entries),
      });
    }
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
    if (this.isNewRecord()) {
      this.props.onChange(this.getValue() + '/');
      // track title field so we can use it for the folder name
      const titleInput = document.querySelector('[id*=title-field]');
      titleInput.addEventListener('input', (e) => {
        const title = e.target.value;
        this.setState({ title });
        const selectProps = this.selectRef.current.props;
        const currentParent = selectProps.value?.value || '/';
        this.handleChange(currentParent);
      });
    }
  }

  getOptions(hits) {
    const { collection } = this.props;
    const fullPath = this.getFullPath();
    const parentPath = this.getParent(fullPath) || '';
    const parent = hits.find((e) => this.getPath(e.path) === parentPath);
    const label = (parent && parent.data.title) || collection.get('label');
    const options = [
      {
        value: parentPath,
        label,
        collection: this.props.collection,
        entries: hits,
        onSelectNode: (value) => this.handleChange(value),
      },
    ];

    return options;
  }

  async loadOptions() {
    if (this.state.optionsLoaded) {
      return this.state.options;
    }
    const { forID, query, collection } = this.props;
    const collectionName = collection.get('name');
    const {
      payload: { hits = [] },
    } = await query(forID, collectionName, ['path'], '');

    const options = this.getOptions(hits);
    this.setState({
      optionsLoaded: true,
      options,
    });

    return options;
  }

  render() {
    const { forID, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;

    return (
      <AsyncSelect
        value={this.state.options[0]}
        loadOptions={() => this.loadOptions()}
        defaultOptions
        inputId={forID}
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

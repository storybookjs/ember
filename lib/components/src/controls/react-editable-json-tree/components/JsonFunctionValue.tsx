/* eslint-disable react/sort-comp */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/button-has-type */
import React, { Component, ReactElement } from 'react';

import { isComponentWillChange } from '../utils/objectTypes';
import * as inputUsageTypes from '../types/inputUsageTypes';

interface JsonFunctionValueState {
  value: JsonFunctionValueProps['value'];
  name: JsonFunctionValueProps['name'];
  keyPath: string[];
  deep: JsonFunctionValueProps['deep'];
  editEnabled: boolean;
  inputRef: any;
}

export class JsonFunctionValue extends Component<JsonFunctionValueProps, JsonFunctionValueState> {
  constructor(props: JsonFunctionValueProps) {
    super(props);
    const keyPath = [...props.keyPath, props.name];
    this.state = {
      value: props.value,
      name: props.name,
      keyPath,
      deep: props.deep,
      editEnabled: false,
      inputRef: null,
    };

    // Bind
    this.handleEditMode = this.handleEditMode.bind(this);
    this.refInput = this.refInput.bind(this);
    this.handleCancelEdit = this.handleCancelEdit.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
  }

  static getDerivedStateFromProps(props: JsonFunctionValueProps, state: JsonFunctionValueState) {
    return props.value !== state.value ? { value: props.value } : null;
  }

  componentDidUpdate() {
    const { editEnabled, inputRef, name, value, keyPath, deep } = this.state;
    const { readOnly, dataType } = this.props;
    const readOnlyResult = readOnly(name, value, keyPath, deep, dataType);

    if (editEnabled && !readOnlyResult && typeof inputRef.focus === 'function') {
      inputRef.focus();
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeydown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeydown);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return;
    if (event.code === 'Enter' || event.key === 'Enter') {
      event.preventDefault();
      this.handleEdit();
    }
    if (event.code === 'Escape' || event.key === 'Escape') {
      event.preventDefault();
      this.handleCancelEdit();
    }
  }

  handleEdit() {
    const { handleUpdateValue, originalValue, logger, onSubmitValueParser, keyPath } = this.props;
    const { inputRef, name, deep } = this.state;
    if (!inputRef) return;

    const newValue = onSubmitValueParser(true, keyPath, deep, name, inputRef.value);

    const result = {
      value: newValue,
      key: name,
    };

    // Run update
    handleUpdateValue(result)
      .then(() => {
        // Cancel edit mode if necessary
        if (!isComponentWillChange(originalValue, newValue)) {
          this.handleCancelEdit();
        }
      })
      .catch(logger.error);
  }

  handleEditMode() {
    this.setState({
      editEnabled: true,
    });
  }

  refInput(node: any) {
    // @ts-ignore
    this.state.inputRef = node;
  }

  handleCancelEdit() {
    this.setState({
      editEnabled: false,
    });
  }

  render() {
    const { name, value, editEnabled, keyPath, deep } = this.state;
    const {
      handleRemove,
      originalValue,
      readOnly,
      dataType,
      getStyle,
      editButtonElement,
      cancelButtonElement,
      textareaElementGenerator,
      minusMenuElement,
      keyPath: comeFromKeyPath,
    } = this.props;

    const style = getStyle(name, originalValue, keyPath, deep, dataType);
    let result = null;
    let minusElement = null;
    const resultOnlyResult = readOnly(name, originalValue, keyPath, deep, dataType);

    if (editEnabled && !resultOnlyResult) {
      const textareaElement = textareaElementGenerator(
        inputUsageTypes.VALUE,
        comeFromKeyPath,
        deep,
        name,
        originalValue,
        dataType
      );

      const editButtonElementLayout = React.cloneElement(editButtonElement, {
        onClick: this.handleEdit,
      });
      const cancelButtonElementLayout = React.cloneElement(cancelButtonElement, {
        onClick: this.handleCancelEdit,
      });
      const textareaElementLayout = React.cloneElement(textareaElement, {
        ref: this.refInput,
        defaultValue: originalValue,
      });

      result = (
        <span className="rejt-edit-form" style={style.editForm}>
          {textareaElementLayout} {cancelButtonElementLayout}
          {editButtonElementLayout}
        </span>
      );
      minusElement = null;
    } else {
      /* eslint-disable jsx-a11y/no-static-element-interactions */
      result = (
        <span
          className="rejt-value"
          style={style.value}
          onClick={resultOnlyResult ? null : this.handleEditMode}
        >
          {value}
        </span>
      );
      /* eslint-enable */
      const minusMenuLayout = React.cloneElement(minusMenuElement, {
        onClick: handleRemove,
        className: 'rejt-minus-menu',
        style: style.minus,
      });
      minusElement = resultOnlyResult ? null : minusMenuLayout;
    }

    return (
      <li className="rejt-function-value-node" style={style.li}>
        <span className="rejt-name" style={style.name}>
          {name} :{' '}
        </span>
        {result}
        {minusElement}
      </li>
    );
  }
}

interface JsonFunctionValueProps {
  name: string;
  value: any;
  originalValue?: any;
  keyPath?: string[];
  deep?: number;
  handleRemove?: (...args: any) => any;
  handleUpdateValue?: (...args: any) => any;
  readOnly: (...args: any) => any;
  dataType?: string;
  getStyle: (...args: any) => any;
  editButtonElement?: ReactElement;
  cancelButtonElement?: ReactElement;
  textareaElementGenerator: (...args: any) => any;
  minusMenuElement?: ReactElement;
  logger: any;
  onSubmitValueParser: (...args: any) => any;
}

// @ts-ignore
JsonFunctionValue.defaultProps = {
  keyPath: [],
  deep: 0,
  handleUpdateValue: () => {},
  editButtonElement: <button>e</button>,
  cancelButtonElement: <button>c</button>,
  minusMenuElement: <span> - </span>,
};

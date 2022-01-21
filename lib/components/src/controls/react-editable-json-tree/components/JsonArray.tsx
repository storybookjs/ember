/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { Component, ReactElement } from 'react';

import { JsonNode } from './JsonNode';
import { JsonAddValue } from './JsonAddValue';
import { ADD_DELTA_TYPE, REMOVE_DELTA_TYPE, UPDATE_DELTA_TYPE } from '../types/deltaTypes';

interface JsonArrayState {
  data: JsonArrayProps['data'];
  name: JsonArrayProps['name'];
  keyPath: string[];
  deep: JsonArrayProps['deep'];
  nextDeep: JsonArrayProps['deep'];
  collapsed: any;
  addFormVisible: boolean;
}
export class JsonArray extends Component<JsonArrayProps, JsonArrayState> {
  constructor(props: JsonArrayProps) {
    super(props);
    const keyPath = [...props.keyPath, props.name];
    this.state = {
      data: props.data,
      name: props.name,
      keyPath,
      deep: props.deep,
      nextDeep: props.deep + 1,
      collapsed: props.isCollapsed(keyPath, props.deep, props.data),
      addFormVisible: false,
    };

    // Bind
    this.handleCollapseMode = this.handleCollapseMode.bind(this);
    this.handleRemoveItem = this.handleRemoveItem.bind(this);
    this.handleAddMode = this.handleAddMode.bind(this);
    this.handleAddValueAdd = this.handleAddValueAdd.bind(this);
    this.handleAddValueCancel = this.handleAddValueCancel.bind(this);
    this.handleEditValue = this.handleEditValue.bind(this);
    this.onChildUpdate = this.onChildUpdate.bind(this);
    this.renderCollapsed = this.renderCollapsed.bind(this);
    this.renderNotCollapsed = this.renderNotCollapsed.bind(this);
  }

  static getDerivedStateFromProps(props: JsonArrayProps, state: JsonArrayState) {
    return props.data !== state.data ? { data: props.data } : null;
  }

  onChildUpdate(childKey: string, childData: any) {
    const { data, keyPath } = this.state;
    // Update data
    // @ts-ignore
    data[childKey] = childData;
    // Put new data
    this.setState({
      data,
    });
    // Spread
    const { onUpdate } = this.props;
    const size = keyPath.length;
    onUpdate(keyPath[size - 1], data);
  }

  handleAddMode() {
    this.setState({
      addFormVisible: true,
    });
  }

  handleCollapseMode() {
    this.setState((state) => ({
      collapsed: !state.collapsed,
    }));
  }

  handleRemoveItem(index: number) {
    return () => {
      const { beforeRemoveAction, logger } = this.props;
      const { data, keyPath, nextDeep: deep } = this.state;
      const oldValue = data[index];

      // Before Remove Action
      beforeRemoveAction(index, keyPath, deep, oldValue)
        .then(() => {
          const deltaUpdateResult = {
            keyPath,
            deep,
            key: index,
            oldValue,
            type: REMOVE_DELTA_TYPE,
          };

          data.splice(index, 1);
          this.setState({ data });

          // Spread new update
          const { onUpdate, onDeltaUpdate } = this.props;
          onUpdate(keyPath[keyPath.length - 1], data);
          // Spread delta update
          onDeltaUpdate(deltaUpdateResult);
        })
        .catch(logger.error);
    };
  }

  handleAddValueAdd({ newValue }: any) {
    const { data, keyPath, nextDeep: deep } = this.state;
    const { beforeAddAction, logger } = this.props;

    beforeAddAction(data.length, keyPath, deep, newValue)
      .then(() => {
        // Update data
        const newData = [...data, newValue];
        this.setState({
          data: newData,
        });
        // Cancel add to close
        this.handleAddValueCancel();
        // Spread new update
        const { onUpdate, onDeltaUpdate } = this.props;
        onUpdate(keyPath[keyPath.length - 1], newData);
        // Spread delta update
        onDeltaUpdate({
          type: ADD_DELTA_TYPE,
          keyPath,
          deep,
          key: newData.length - 1,
          newValue,
        });
      })
      .catch(logger.error);
  }

  handleAddValueCancel() {
    this.setState({
      addFormVisible: false,
    });
  }

  handleEditValue({ key, value }: any) {
    return new Promise((resolve, reject) => {
      const { beforeUpdateAction } = this.props;
      const { data, keyPath, nextDeep: deep } = this.state;

      // Old value
      const oldValue = data[key];

      // Before update action
      beforeUpdateAction(key, keyPath, deep, oldValue, value)
        .then(() => {
          // Update value
          data[key] = value;
          // Set state
          this.setState({
            data,
          });
          // Spread new update
          const { onUpdate, onDeltaUpdate } = this.props;
          onUpdate(keyPath[keyPath.length - 1], data);
          // Spread delta update
          onDeltaUpdate({
            type: UPDATE_DELTA_TYPE,
            keyPath,
            deep,
            key,
            newValue: value,
            oldValue,
          });
          // Resolve
          resolve(undefined);
        })
        .catch(reject);
    });
  }

  renderCollapsed() {
    const { name, data, keyPath, deep } = this.state;
    const { handleRemove, readOnly, getStyle, dataType, minusMenuElement } = this.props;
    const { minus, collapsed } = getStyle(name, data, keyPath, deep, dataType);

    const isReadOnly = readOnly(name, data, keyPath, deep, dataType);

    const removeItemButton = React.cloneElement(minusMenuElement, {
      onClick: handleRemove,
      className: 'rejt-minus-menu',
      style: minus,
    });

    /* eslint-disable jsx-a11y/no-static-element-interactions */
    return (
      <span className="rejt-collapsed">
        <span className="rejt-collapsed-text" style={collapsed} onClick={this.handleCollapseMode}>
          [...] {data.length} {data.length === 1 ? 'item' : 'items'}
        </span>
        {!isReadOnly && removeItemButton}
      </span>
    );
    /* eslint-enable */
  }

  renderNotCollapsed() {
    const { name, data, keyPath, deep, addFormVisible, nextDeep } = this.state;
    const {
      isCollapsed,
      handleRemove,
      onDeltaUpdate,
      readOnly,
      getStyle,
      dataType,
      addButtonElement,
      cancelButtonElement,
      editButtonElement,
      inputElementGenerator,
      textareaElementGenerator,
      minusMenuElement,
      plusMenuElement,
      beforeRemoveAction,
      beforeAddAction,
      beforeUpdateAction,
      logger,
      onSubmitValueParser,
    } = this.props;
    const { minus, plus, delimiter, ul, addForm } = getStyle(name, data, keyPath, deep, dataType);

    const isReadOnly = readOnly(name, data, keyPath, deep, dataType);

    const addItemButton = React.cloneElement(plusMenuElement, {
      onClick: this.handleAddMode,
      className: 'rejt-plus-menu',
      style: plus,
    });
    const removeItemButton = React.cloneElement(minusMenuElement, {
      onClick: handleRemove,
      className: 'rejt-minus-menu',
      style: minus,
    });

    const onlyValue = true;
    const startObject = '[';
    const endObject = ']';
    return (
      <span className="rejt-not-collapsed">
        <span className="rejt-not-collapsed-delimiter" style={delimiter}>
          {startObject}
        </span>
        {!addFormVisible && addItemButton}
        <ul className="rejt-not-collapsed-list" style={ul}>
          {data.map((item, index) => (
            <JsonNode
              key={index}
              name={`${index}`}
              data={item}
              keyPath={keyPath}
              deep={nextDeep}
              isCollapsed={isCollapsed}
              handleRemove={this.handleRemoveItem(index)}
              handleUpdateValue={this.handleEditValue}
              onUpdate={this.onChildUpdate}
              onDeltaUpdate={onDeltaUpdate}
              readOnly={readOnly}
              getStyle={getStyle}
              addButtonElement={addButtonElement}
              cancelButtonElement={cancelButtonElement}
              editButtonElement={editButtonElement}
              inputElementGenerator={inputElementGenerator}
              textareaElementGenerator={textareaElementGenerator}
              minusMenuElement={minusMenuElement}
              plusMenuElement={plusMenuElement}
              beforeRemoveAction={beforeRemoveAction}
              beforeAddAction={beforeAddAction}
              beforeUpdateAction={beforeUpdateAction}
              logger={logger}
              onSubmitValueParser={onSubmitValueParser}
            />
          ))}
        </ul>
        {!isReadOnly && addFormVisible && (
          <div className="rejt-add-form" style={addForm}>
            <JsonAddValue
              handleAdd={this.handleAddValueAdd}
              handleCancel={this.handleAddValueCancel}
              onlyValue={onlyValue}
              addButtonElement={addButtonElement}
              cancelButtonElement={cancelButtonElement}
              inputElementGenerator={inputElementGenerator}
              keyPath={keyPath}
              deep={deep}
              onSubmitValueParser={onSubmitValueParser}
            />
          </div>
        )}
        <span className="rejt-not-collapsed-delimiter" style={delimiter}>
          {endObject}
        </span>
        {!isReadOnly && removeItemButton}
      </span>
    );
  }

  render() {
    const { name, collapsed, data, keyPath, deep } = this.state;
    const { dataType, getStyle } = this.props;
    const value = collapsed ? this.renderCollapsed() : this.renderNotCollapsed();
    const style = getStyle(name, data, keyPath, deep, dataType);

    /* eslint-disable jsx-a11y/no-static-element-interactions */
    return (
      <div className="rejt-array-node">
        <span onClick={this.handleCollapseMode}>
          <span className="rejt-name" style={style.name}>
            {name} :{' '}
          </span>
        </span>
        {value}
      </div>
    );
    /* eslint-enable */
  }
}

interface JsonArrayProps {
  data: any[];
  name: string;
  isCollapsed: (...args: any) => any;
  keyPath?: string[];
  deep?: number;
  handleRemove?: (...args: any) => any;
  onUpdate: (...args: any) => any;
  onDeltaUpdate: (...args: any) => any;
  readOnly: (...args: any) => any;
  dataType?: string;
  getStyle: (...args: any) => any;
  addButtonElement?: ReactElement;
  cancelButtonElement?: ReactElement;
  editButtonElement?: ReactElement;
  inputElementGenerator: (...args: any) => any;
  textareaElementGenerator: (...args: any) => any;
  minusMenuElement?: ReactElement;
  plusMenuElement?: ReactElement;
  beforeRemoveAction?: (...args: any) => any;
  beforeAddAction?: (...args: any) => any;
  beforeUpdateAction?: (...args: any) => any;
  logger: any;
  onSubmitValueParser: (...args: any) => any;
}

// @ts-ignore
JsonArray.defaultProps = {
  keyPath: [],
  deep: 0,
  minusMenuElement: <span> - </span>,
  plusMenuElement: <span> + </span>,
};

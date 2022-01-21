import React, { Component, ReactElement } from 'react';

import { JsonValue } from './JsonValue';
import { JsonObject } from './JsonObject';
import { JsonArray } from './JsonArray';
import { JsonFunctionValue } from './JsonFunctionValue';
import { getObjectType } from '../utils/objectTypes';
import * as dataTypes from '../types/dataTypes';

interface JsonNodeState {
  data: JsonNodeProps['data'];
  name: JsonNodeProps['name'];
  keyPath: JsonNodeProps['keyPath'];
  deep: JsonNodeProps['deep'];
}

export class JsonNode extends Component<JsonNodeProps, JsonNodeState> {
  constructor(props: JsonNodeProps) {
    super(props);
    this.state = {
      data: props.data,
      name: props.name,
      keyPath: props.keyPath,
      deep: props.deep,
    };
  }

  static getDerivedStateFromProps(props: JsonNodeProps, state: JsonNodeState) {
    return props.data !== state.data ? { data: props.data } : null;
  }

  render() {
    const { data, name, keyPath, deep } = this.state;
    const {
      isCollapsed,
      handleRemove,
      handleUpdateValue,
      onUpdate,
      onDeltaUpdate,
      readOnly,
      getStyle,
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
    const readOnlyTrue = () => true;

    const dataType = getObjectType(data);
    switch (dataType) {
      case dataTypes.ERROR:
        return (
          <JsonObject
            data={data}
            name={name}
            isCollapsed={isCollapsed}
            keyPath={keyPath}
            deep={deep}
            handleRemove={handleRemove}
            onUpdate={onUpdate}
            onDeltaUpdate={onDeltaUpdate}
            readOnly={readOnlyTrue}
            dataType={dataType}
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
        );
      case dataTypes.OBJECT:
        return (
          <JsonObject
            data={data}
            name={name}
            isCollapsed={isCollapsed}
            keyPath={keyPath}
            deep={deep}
            handleRemove={handleRemove}
            onUpdate={onUpdate}
            onDeltaUpdate={onDeltaUpdate}
            readOnly={readOnly}
            dataType={dataType}
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
        );
      case dataTypes.ARRAY:
        return (
          <JsonArray
            data={data}
            name={name}
            isCollapsed={isCollapsed}
            keyPath={keyPath}
            deep={deep}
            handleRemove={handleRemove}
            onUpdate={onUpdate}
            onDeltaUpdate={onDeltaUpdate}
            readOnly={readOnly}
            dataType={dataType}
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
        );
      case dataTypes.STRING:
        return (
          <JsonValue
            name={name}
            value={`"${data}"`}
            originalValue={data}
            keyPath={keyPath}
            deep={deep}
            handleRemove={handleRemove}
            handleUpdateValue={handleUpdateValue}
            readOnly={readOnly}
            dataType={dataType}
            getStyle={getStyle}
            cancelButtonElement={cancelButtonElement}
            editButtonElement={editButtonElement}
            inputElementGenerator={inputElementGenerator}
            minusMenuElement={minusMenuElement}
            logger={logger}
            onSubmitValueParser={onSubmitValueParser}
          />
        );
      case dataTypes.NUMBER:
        return (
          <JsonValue
            name={name}
            value={data}
            originalValue={data}
            keyPath={keyPath}
            deep={deep}
            handleRemove={handleRemove}
            handleUpdateValue={handleUpdateValue}
            readOnly={readOnly}
            dataType={dataType}
            getStyle={getStyle}
            cancelButtonElement={cancelButtonElement}
            editButtonElement={editButtonElement}
            inputElementGenerator={inputElementGenerator}
            minusMenuElement={minusMenuElement}
            logger={logger}
            onSubmitValueParser={onSubmitValueParser}
          />
        );
      case dataTypes.BOOLEAN:
        return (
          <JsonValue
            name={name}
            value={data ? 'true' : 'false'}
            originalValue={data}
            keyPath={keyPath}
            deep={deep}
            handleRemove={handleRemove}
            handleUpdateValue={handleUpdateValue}
            readOnly={readOnly}
            dataType={dataType}
            getStyle={getStyle}
            cancelButtonElement={cancelButtonElement}
            editButtonElement={editButtonElement}
            inputElementGenerator={inputElementGenerator}
            minusMenuElement={minusMenuElement}
            logger={logger}
            onSubmitValueParser={onSubmitValueParser}
          />
        );
      case dataTypes.DATE:
        return (
          <JsonValue
            name={name}
            value={data.toISOString()}
            originalValue={data}
            keyPath={keyPath}
            deep={deep}
            handleRemove={handleRemove}
            handleUpdateValue={handleUpdateValue}
            readOnly={readOnlyTrue}
            dataType={dataType}
            getStyle={getStyle}
            cancelButtonElement={cancelButtonElement}
            editButtonElement={editButtonElement}
            inputElementGenerator={inputElementGenerator}
            minusMenuElement={minusMenuElement}
            logger={logger}
            onSubmitValueParser={onSubmitValueParser}
          />
        );
      case dataTypes.NULL:
        return (
          <JsonValue
            name={name}
            value="null"
            originalValue="null"
            keyPath={keyPath}
            deep={deep}
            handleRemove={handleRemove}
            handleUpdateValue={handleUpdateValue}
            readOnly={readOnly}
            dataType={dataType}
            getStyle={getStyle}
            cancelButtonElement={cancelButtonElement}
            editButtonElement={editButtonElement}
            inputElementGenerator={inputElementGenerator}
            minusMenuElement={minusMenuElement}
            logger={logger}
            onSubmitValueParser={onSubmitValueParser}
          />
        );
      case dataTypes.UNDEFINED:
        return (
          <JsonValue
            name={name}
            value="undefined"
            originalValue="undefined"
            keyPath={keyPath}
            deep={deep}
            handleRemove={handleRemove}
            handleUpdateValue={handleUpdateValue}
            readOnly={readOnly}
            dataType={dataType}
            getStyle={getStyle}
            cancelButtonElement={cancelButtonElement}
            editButtonElement={editButtonElement}
            inputElementGenerator={inputElementGenerator}
            minusMenuElement={minusMenuElement}
            logger={logger}
            onSubmitValueParser={onSubmitValueParser}
          />
        );
      case dataTypes.FUNCTION:
        return (
          <JsonFunctionValue
            name={name}
            value={data.toString()}
            originalValue={data}
            keyPath={keyPath}
            deep={deep}
            handleRemove={handleRemove}
            handleUpdateValue={handleUpdateValue}
            readOnly={readOnly}
            dataType={dataType}
            getStyle={getStyle}
            cancelButtonElement={cancelButtonElement}
            editButtonElement={editButtonElement}
            textareaElementGenerator={textareaElementGenerator}
            minusMenuElement={minusMenuElement}
            logger={logger}
            onSubmitValueParser={onSubmitValueParser}
          />
        );
      case dataTypes.SYMBOL:
        return (
          <JsonValue
            name={name}
            value={data.toString()}
            originalValue={data}
            keyPath={keyPath}
            deep={deep}
            handleRemove={handleRemove}
            handleUpdateValue={handleUpdateValue}
            readOnly={readOnlyTrue}
            dataType={dataType}
            getStyle={getStyle}
            cancelButtonElement={cancelButtonElement}
            editButtonElement={editButtonElement}
            inputElementGenerator={inputElementGenerator}
            minusMenuElement={minusMenuElement}
            logger={logger}
            onSubmitValueParser={onSubmitValueParser}
          />
        );
      default:
        return null;
    }
  }
}

interface JsonNodeProps {
  name: string;
  data?: any;
  isCollapsed: (...args: any) => any;
  keyPath?: string[];
  deep?: number;
  handleRemove?: (...args: any) => any;
  handleUpdateValue?: (...args: any) => any;
  onUpdate: (...args: any) => any;
  onDeltaUpdate: (...args: any) => any;
  readOnly: (...args: any) => any;
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
  logger: object;
  onSubmitValueParser: (...args: any) => any;
}

/// @ts-ignore
JsonNode.defaultProps = {
  keyPath: [],
  deep: 0,
};

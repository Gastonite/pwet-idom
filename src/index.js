import { patch, currentElement, skip, renderHeading, renderElement, text } from 'idom-util';
import { isFunction, isNull, isObject, isUndefined } from "kwak";
import { decorate, noop } from "pwet/src/utilities";
import { $pwet, Definition } from "pwet";
import debounce from "lodash.debounce";
import {
  attributes,
  applyProp,
  applyAttr,
  symbols
} from 'incremental-dom';

const tagNames = [];

const $update = Symbol('__update');
const $properties = Symbol('__properties');


const defaultAttributeApply = attributes[symbols.default];

attributes[symbols.default] = (element, name, value) => {

  if (!($pwet in element))
    return void defaultAttributeApply(element, name, value);

  const { definition, update } = element[$pwet];
  const { tagName, verbose, properties } = definition;

  if (!(name in properties))
    return void defaultAttributeApply(element, name, value);

  if (verbose)
    console.log('IDOM applyProperty', name, value);
  //console.error(`[${tagName}]`, 'IDOM', name, value);

  if (!element[$update])
    element[$update] = debounce(() => {

      update(element[$properties], { partial: true });

      element[$properties] = {};
    }, 0);

  if (!element[$properties])
    element[$properties] = {};

  element[$properties][name] = value;

  element[$update]();
};

const IDOMDefinition = (definition = {}) => {

  console.error(`<${definition.tagName}>`, 'IDOMRenderer()');

  const { tagName, hooks } = definition = Definition.parseDefinition(definition);

  hooks.render = decorate(hooks.render, (next, component) => {

    console.error('idom', component)
    patch(component.element, next, component);
  });

  tagNames.push(tagName.toUpperCase());


  return definition;
};

const renderComponent = (...args) => renderElement(...args, skip);

export {
  IDOMDefinition as default,
  renderComponent
};
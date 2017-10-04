import { patch, currentElement, skip, renderHeading, renderElement, text } from 'idom-util';
import { decorate } from "pwet/src/utilities";
import { $pwet } from "pwet";
import debounce from "lodash.debounce";
import { attributes, applyProp, symbols } from 'incremental-dom';

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


const IDOMComponent = (component) => {

  console.error('IDOMComponent()');

  const { hooks } = component;

  hooks.render = decorate(hooks.render, (next, component) => {

    console.error('IDOMComponent.render()');
    patch(component.root, next, component);
  });

  return component;
};

const renderComponent = (...args) => renderElement(...args, skip);

export {
  IDOMComponent as default,
  renderComponent
};
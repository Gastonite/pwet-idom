import { patch as _patch, currentElement, skip, renderHeading, renderElement, text } from 'idom-util';
import { isFunction, isNull, isObject, isUndefined } from "kwak";
import { decorate, noop } from "pwet/src/utilities";
import { $pwet } from "pwet";
import debounce from "lodash.debounce";
import {
  attributes,
  applyProp,
  applyAttr,
  symbols
} from 'incremental-dom';

const tagNames = [];

const $initialize = Symbol('$initialize');
const $properties = Symbol('$properties');
const $template = Symbol('$template');
const applyAttributeTyped = attributes[symbols.default];

attributes[symbols.default] = (element, name, value) => {

  if (name.startsWith('on-') && isFunction(value))
    element.addEventListener(name.slice(3), value);

  // return void applyAttributeTyped(element, name, value);
  if (!($pwet in element) || !tagNames.includes(element.tagName))
    return void applyAttributeTyped(element, name, value);

  const { factory } = element[$pwet];

  const foundProperty = factory.properties.find(({ name:propertyName, isDataAttribute }) => {
    return propertyName === name;
  });

  if (factory.logLevel > 0)
    console.error(`[${factory.tagName}]`, 'IDOM', name, value, foundProperty);

  if (isUndefined(foundProperty))
    return void applyAttributeTyped(element, name, value);

  if (!element[$initialize])
    element[$initialize] = debounce(() => {

      element.initialize(Object.assign(element.properties, element[$properties]));

      element[$properties] = {};
    }, 0);

  if (!element[$properties])
    element[$properties] = {};

  element[$properties][name] = value;

  element[$initialize]();
};


const patch = (element, renderMarkup) => {

  if (isNull(element.shadowRoot))
    return _patch(element, renderMarkup);
  const template = element[$template] = element[$template] || document.createElement('template');
  if (template.content.children.length > 0){
    return _patch(template.content, renderMarkup);


    // return;
    // } else {
    // return _patch(element.shadowRoot, renderMarkup);

  }

  // if (ShadyCSS.nativeShadow) {
  //   console.log('element.shadowRoot.children=', element.shadowRoot.children)
  //   console.log('template.content.children=', template.content.children)
  //
  //   if (element.shadowRoot.children.length < 1) {
  //     _patch(template.content, renderMarkup);
  //
  //     element.shadowRoot.appendChild(template.content);
  //     return;
  //   }
  //
  //   return _patch(element.shadowRoot, renderMarkup);
  // }


  if (element.shadowRoot.children.length < 1) {
    _patch(template.content, renderMarkup);
    if (!ShadyCSS.nativeShadow) {

      ShadyCSS.prepareTemplate(template, element.localName);

      ShadyCSS.styleElement(element);
    }
    element.shadowRoot.appendChild(template.content);
    return;
  }

  return _patch(element.shadowRoot, renderMarkup);

  // _patch(template.content, renderMarkup);

  // if (!ShadyCSS.nativeShadow) {

  // }

  // if (element.shadowRoot.children.length < 1)
  //   element.shadowRoot.appendChild(template.content);
  // else
  //   element.shadowRoot.replaceChild(template.content.cloneNode(true), element.shadowRoot.firstChild);

};


const IDOMComponent =  (factory) => {

  factory.render = decorate(factory.render, (next, component, ...args) => {
    patch(component.element, () => next(component, ...args));
  });

  factory.create = decorate(factory.create, (next, component, ...args) => {

    let hooks = next(component, ...args);

    if (!isObject(hooks) || isNull(hooks))
      hooks = {};

    if (!isFunction(hooks.render))
      hooks.render = noop;

    hooks.render = decorate(hooks.render, (next, ...args) => {
      patch(component.element, () => next(...args));
    });

    return hooks;
  });

  tagNames.push(factory.tagName.toUpperCase());

  return factory;
};

const renderComponent = (...args) => renderElement(...args, skip);

export {
  IDOMComponent as default,
  patch,
  renderComponent
};
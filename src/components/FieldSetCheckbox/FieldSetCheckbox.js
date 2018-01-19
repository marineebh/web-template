import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { FieldCheckbox } from '../../components';
import css from './FieldSetCheckbox.css';

class FieldSetCheckbox extends Component {
  constructor(props) {
    super(props);
    this.state = { selected: [] };
  }

  render() {
    const { rootClassName, className, name, legend, options, twoColumns } = this.props;
    const classes = classNames(rootClassName || css.root, className);
    const listClasses = twoColumns ? classNames(css.list, css.twoColumns) : css.list;

    return (
      <fieldset className={classes}>
        {legend ? <legend>{legend}</legend> : null}
        <ul className={listClasses}>
          {options.map(option => {
            const id = `${name}-${option.name}`;
            return (
              <li key={id} className={css.item}>
                <FieldCheckbox id={id} name={option.name} text={option.text} />
              </li>
            );
          })}
        </ul>
      </fieldset>
    );
  }
}

FieldSetCheckbox.defaultProps = {
  rootClassName: null,
  className: null,
  legend: null,
  twoColumns: false,
};

const { arrayOf, bool, node, shape, string } = PropTypes;

FieldSetCheckbox.propTypes = {
  rootClassName: string,
  className: string,
  name: string.isRequired,
  legend: node,
  options: arrayOf(
    shape({
      name: string.isRequired,
      text: node.isRequired,
    })
  ).isRequired,
  twoColumns: bool,
};

export default FieldSetCheckbox;

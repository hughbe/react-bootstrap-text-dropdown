import React, { Component } from 'react';
import sortByLevenshteinDistance from 'levenshtein-sort';

export default class TextDropdown extends Component {
  state = {value: ''};

  componentWillMount = () => this.setState({value: this.props.defaultValue || ''});

  handleInputChanged = (event) => {
    this.filterValues(event.target.value);
    this.props.onInputChanged && this.props.onInputChanged(event.target.value);
  }

  handleValueSelected = (event, value) => {
    event.preventDefault();
    this.filterValues(value);
    this.props.onValueSelected(value);
  }

  filterValues = (value) => {
    const valueSelector = this.props.valueSelector || (value => value);
    const maximumLength = this.props.maximumLength || 10;

    const lowerValue = value.toLowerCase();
    const filteredValues = this.props.values && this.props.values.filter(value => valueSelector(value).toLowerCase().indexOf(lowerValue) !== -1)
                            .sort((a, b) => sortByLevenshteinDistance(lowerValue, valueSelector(a), valueSelector(b)))
                            .slice(0, maximumLength);

    this.setState({value, filteredValues});
  }

  handleInputKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      // If the down arrow is pressed, start selecting items in the dropdown.
      const firstDropdownItem = document.getElementById(`${this.props.id}-text-dropdown`).firstChild;
      firstDropdownItem && this.focusElement(firstDropdownItem);
    } else if (event.key === 'Enter') {
      // If the user pressed ctrl-enter, let the user know.
      if (event.ctrlKey) {
        if (this.state.value.length === 0) {
          // If the text box is empty, stop editing.
          this.props.onControlEnter && this.props.onControlEnter();
        } else {
          // If the text box is not empty, just complete the current value.
          this.handleValueSelected(event, this.state.value);
        }
        return;
      }

      // If the user pressed enter and there is a single item in the list, select it.
      if (this.state.filteredValues && this.state.filteredValues.length === 1) {
        this.handleValueSelected(event, this.state.filteredValues[0]);
      }
    }
  }

  focusElement = (currentElement) => this.setState({currentElement}) || currentElement.focus();

  handleDropdownKeyUp = (event) => {
    // If the up arrow is pressed and we are at the top of the list, focus the input.
    if (event.key === 'ArrowUp') {
      event.preventDefault();

      const { currentElement } = this.state;
      const previousElement = currentElement && currentElement.previousSibling;
      if (previousElement) {
        // If there is a previous item in the list, we are not trying to select the text input.
        this.focusElement(previousElement);        
        return;
      } else if (!currentElement) {
        // If this is the first item in the list, we are about to select the text input.
        this.setState({currentElement: document.activeElement});
        return;
      }

      const input = document.getElementById(`${this.props.id}-dropdown-input`);
      input.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();

      const nextElement = this.state.currentElement.nextSibling;
      nextElement && this.focusElement(nextElement);
    } else if (event.key === 'Tab') {
      this.setState({currentElement: document.activeElement.nextSibling});
    }
  }

  render() {
    const valueSelector = this.props.valueSelector || (value => value);
    const { className, id, placeholder } = this.props;
    const { value, filteredValues } = this.state;

    const results = filteredValues && filteredValues.map((value, index) => (
      <a key={index} className="dropdown-item" href="#" tabIndex="0" onClick={e => this.handleValueSelected(e, value)}>{valueSelector(value)}</a>
    ));

    // Don't show the dropdown if there is no text in the list, the list is empty or there is one exact match.
    const showDropdown = value.length !== 0 && filteredValues && filteredValues.length !== 0 && !(filteredValues.length === 1 && valueSelector(filteredValues[0]) === value);

    return (
      <div className={`${className} dropdown ${showDropdown ? 'show' : ''}`}>
        <input
          id={`${id}-dropdown-input`}
          type="text"
          placeholder={placeholder || 'Enter'}
          autoComplete="off"
          className="form-control"
          autoFocus
          tabIndex={0}
          value={value}
          onChange={this.handleInputChanged}
          onKeyDown={this.handleInputKeyDown}
          onKeyPress={(e) => e.stopPropagation()}
          required />
        <ul id={`${id}-text-dropdown`} className="dropdown-menu" onKeyDown={this.handleDropdownKeyUp}>
          {results}
        </ul>
      </div>
    );
  }
}
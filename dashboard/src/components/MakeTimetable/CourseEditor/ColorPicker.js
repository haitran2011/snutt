import React, { Component } from 'react'

const COLORS = [
  {fg: "#2B8728", bg: "#B6F9B2"},
  {fg: "#45B2B8", bg: "#BFF7F8"},
  {fg: "#1579C2", bg: "#94E6FE"},
  {fg: "#A337A1", bg: "#F6B5F5"},
  {fg: "#B8991B", bg: "#FFF49A"},
  {fg: "#BA313B", bg: "#FFB2BC"},
]

class ColorPicker extends Component {
  constructor(props) {
    super()
    this.handleSelect = this.handleSelect.bind(this)
    this.state = {
      color: props.color
    }
  }

  handleSelect(newColor, e) {
    e.preventDefault()
    console.log(newColor)
    this.props.onChange(newColor)
  }

  render() {
    return (
      <div className='circle-wrapper'>
        {COLORS.map((c, i) => (
          <Circle
            color={c}
            key={i}
            onClick={this.handleSelect}
          />
        ))}
      </div>
    )
  }
}

const Circle = (props) => {
  const { color, onClick } = props
  const style = {
    backgroundColor: color.bg,
    color: color.fg,
  }
  return (
    <div
      className="color-circle"
      onClick={onClick.bind(this, color)}
      style={style}
    >
      <span>A+</span>
    </div>
  )
}

ColorPicker.propTypes = {
  color: React.PropTypes.string,
  onChange: React.PropTypes.func,
}

export default ColorPicker
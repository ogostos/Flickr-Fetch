import React, { Component } from 'react';

class SortedPhotos extends Component {
  render () {
    const { photos, tag } = this.props
    const photosSorted = Object.keys(photos).length ? photos[tag].map((img, i) => {
      return <img src={`https://farm${img.farm}.staticflickr.com/${img.server}/${img.id}_${img.secret}_t.jpg`} data-key={i} key={i}  id={`${img.tag}${i}`} alt={img.tag} title={img.tag}/>
    }) : ''

    return (
      <div data-sort={tag}>
        {photosSorted}
      </div>
    )
  }
}

export default SortedPhotos
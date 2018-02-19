import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tags: [], // keywords to search
      photosData: [], // retrieved pictures
      sorted: {}, // contains pair of tags - photos
      showSort: null, // bool to toggle sorted images display
      text: "Search pics to sort.", // init text/hint for user
      notFoundTag: false, // when keyword search has no photos
      notFoundTagsArray: [] // container for that tags
    }
    // binding of functions which require use of 'this' related to class
    this.searchImage = this.searchImage.bind(this)
    this.displayBucket = this.displayBucket.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
  }
  searchImage (event) {
    event.preventDefault();
    const input = this.refs.search.value; //input keywords
    // reset data
    this.setState({
      showSort: null,
      photosData: [],
      sorted: {},
      tags: [],
      text: input ? "Fetching..." : "Search pics to sort.", // if no user input, show hint
      notFoundTag: false,
      notFoundTagsArray: []
    })
    // local var-s with the same name as corresponding data in constructor
    const photosData = [], sorted = {};
    // grabbing tags from input
    const tags = input.split(',').map(str => str.trim()).reduce((uniqueArray, elem) => {
      if (!uniqueArray.includes(elem) && elem) {
        uniqueArray.push(elem);
      }
      return uniqueArray;
    }, [])
    this.setState({ tags })
    // making API call - Flickr photo search, for each tag
    tags.forEach(async tag => {
      let found = 0;
      sorted[tag] = [];
      let url = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=96b8d279df685ba41863172b17e529ae&tags=${tag}&sort=relevance&per_page=5&format=json&nojsoncallback=1`
      try {
        const resp = await fetch(url).then(res => res.json());
        resp.photos.photo.forEach(x => x.tag = tag);
        found = +resp.photos.total;
        photosData.push(...resp.photos.photo);
      } catch(e) { // catch for error, e.g. bad connection
        this.setState({
          text: "Something went wrong.",
          notFoundTag: true
        })
        return;
      }
      if(!found || this.state.notFoundTag) { // when this keyword or before another one returns with 0 result
        photosData.length = 0;
        if(!found) {
          this.state.notFoundTagsArray.push(tag)
        }
        this.setState({
          text: `No images found for tags: ${this.state.notFoundTagsArray.join(', ')}`,
          notFoundTag: true,
          notFoundTagsArray: this.state.notFoundTagsArray
        })
        return;
      }
      this.shuffleArray(photosData); // radnomize all photos
      this.setState({ photosData, sorted }); //set new state for app
    })
  }

  shuffleArray (a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  displayBucket (event) {
    const id = event.target.id;
    this.setState((prevState) => ({
      showSort: prevState.showSort && prevState.showSort === id ? null : id
    }))
  }
  // Drag'n'Drop functionality
  handleDragStart (e) {
    const dragSource = e.target;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('key', dragSource.dataset.key);
    e.dataTransfer.setData('title', dragSource.title);
    dragSource.classList.add('dragging');
    document.getElementById(`${e.target.title}`).classList.add('valid-drop');
  }

  handleDragEnd (e) {
    e.target.classList.remove('dragging');
    document.getElementById(`${e.target.title}`).classList.remove('valid-drop');
  }

  handleDragOver (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  handleDrop (e) {
    if (e.stopPropagation) {
      e.stopPropagation(); // Stops some browsers from redirecting
    }
    e.preventDefault();
    const id = e.target.id;
    const title = e.dataTransfer.getData('title');
    if(title !== id) { // if droppng into wrong bucket
      return false;
    } else {
      const key = e.dataTransfer.getData('key');
      const deleted = this.state.photosData.splice(key, 1);
      this.state.sorted[id].push(...deleted);
      this.setState({
        photosData: this.state.photosData,
        sorted: this.state.sorted
      })
      if(!this.state.photosData.length) {
        this.setState({
          text: "Great! You've sorted all photos."
         })
      }
    }
    document.getElementById(`${id}`).classList.remove('valid-drop');
  }

  render() {
    const { tags, photosData, sorted, showSort, text, notFoundTag } = this.state
    // buttons generation
    const buttonsList = !notFoundTag ? tags.map((tag, i) => {
      return <button onDragOver={this.handleDragOver} onDrop={this.handleDrop} key={i} id={tag}>{tag}</button>
    }) : ''

    return (
      <div className="App">
        <form onSubmit={this.searchImage}>
          <input type="text" ref="search" placeholder="separate tags with commas, e.g. 'cute cat, rick and morty' " />
          <button>Search</button>
        </form>
        <div onDragStart={this.handleDragStart} onDragEnd={this.handleDragEnd} className="unsorted">
          {photosData.length ? (
            <Photos photos={photosData}/>
          ) : (
            <span>{text}</span>
          )}
        </div>
        <div onClick={this.displayBucket} className="buckets">{buttonsList}</div>
        <div data-sort={showSort} className="sorted">
          {showSort && <Photos photos={sorted[showSort]}/>}
        </div>
      </div>
    );
  }
}

// for rednerig pictures
class Photos extends Component {
  render () {
    return this.props.photos.map((img, i) => {
      return <img src={`https://farm${img.farm}.staticflickr.com/${img.server}/${img.id}_${img.secret}_t.jpg`} data-key={i} key={i} id={`${img.id}`} alt={img.tag} title={img.tag}/>
    })
  }
}

Photos.propTypes = {
  photos: PropTypes.array
};

export default App;

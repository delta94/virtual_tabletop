/* eslint-disable react/destructuring-assignment */
import React from 'react';
import io from 'socket.io-client';
import { withRouter } from 'react-router-dom';
import FormData from 'form-data';
import map from '../../images/battlemap.jpg';
import styles from './grid.module.scss';
import TokenBar from './token_bar';
import empty from '../../images/empty.png';
import { receiveBoard } from '../../actions/board_actions';
import { createBoard } from '../../util/boards_api_util';


// import { createBoard } from '../../util/board_api_util';

// Get all elements nececssary into state
// dispatch create board
// create board on controller should call image upload
// return res and dispatch changes to state


// /games/:gameid/boards

// games/chess/boards/


let socket;


class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.handleBuildGrid = this.handleBuildGrid.bind(this);
    this.handlePieceDrop = this.handlePieceDrop.bind(this);

    this.handleLock = this.handleLock.bind(this);
    this.checkScroll = this.checkScroll.bind(this);
    this.dataTransfer = this.dataTransfer.bind(this);
    this.moveBackground = this.moveBackground.bind(this);

    this.showHideTokenBar = this.showHideTokenBar.bind(this);

    this.createBoard = this.createBoard.bind(this);
    this.handleImage = this.handleImage.bind(this);

    this.setDraggingPiece = this.setDraggingPiece.bind(this)

    this.state = {
      row: null,
      col: null,
      zoomFactorGrid: null,
      zoomFactorImage: null,
      offSetX: null,
      offSetY: null,
      gridArray: null,
      opacity: null,
      borderColor: null,
      gridLocked: true,
      boardBackground: '',
      showInitialEdit: false,
      previewUrl: null,
    };

    this.ENPOINT = 'localhost:5000/gamesNamespace';
    this.zoomGrid = { zoom: 1 };
    this.zoomBackground = { zoom: 1 };
    this.zoomContainer = { zoom: 1 };


    this.dpr = 2;
    this.draggingPiece = null;
  }

  handlePieceDrop(token) {
    this.props.createToken(token);
    // socket.emit('updateToken', token);
    
  }


  showHideTokenBar(e) {
    if (e.pageY > window.innerHeight * 0.8) {
      this.bar.style.display = 'flex';
    } else {
      this.bar.style.display = 'none';
    }
  }

  componentDidMount() {
    
    if (!this.props.create) {
      // this.props.fetchBoard(this.props.match.params.boardId)
      // .then(()=>{

      this.container = document.getElementById('grid-container');

      this.container.addEventListener('wheel', this.checkScroll);
      // debugger
      const state = {
        row: this.props.board.gridSize.rows,
        col: this.props.board.gridSize.cols,
        zoomFactorGrid: this.props.board.gridSize.gridZoomFactor,
        zoomFactorImage: this.props.board.imageAttributes.imageZoomFactor,
        imagePosX: this.props.board.imageAttributes.offsetX,
        imagePosY: this.props.board.imageAttributes.offsetY,
        opacity: this.props.board.settings.opacity,
        borderColor: this.props.board.settings.gridColor,
        boardBackground: this.props.board.backgroundImageUrl,
      };

      this.setState(state, this.handleBuildGrid);

      this.bar = document.getElementById('bar-container');
      document.addEventListener('mousemove', this.showHideTokenBar);
      document.addEventListener('dragover', this.showHideTokenBar);
      this.bar.style.display = 'none';



      document.addEventListener('dragover', (e) => {
        e.preventDefault();
      })


      let canvas = document.getElementById('canvas');
      canvas.addEventListener("drop",(e)=>{
        if (this.draggingPiece) {
          let pos = this.getBoxLocation(e.layerX, e.layerY);

          this.draggingPiece.pos.x = pos[0];
          this.draggingPiece.pos.y = pos[1];

          let gridArray = this.state.gridArray
          gridArray[pos[1]][pos[0]] = this.draggingPiece;
          this.props.createToken(this.draggingPiece)
          this.setState({ gridArray }, ()=>{
            this.draggingPiece = null;
            this.draw();
          });
          
        }
      })



      let mousePressed = false;
      let dragToken = null;
      let draggingImage = new Image;

      let context = canvas.getContext('2d');

      canvas.addEventListener('mousedown', (e) => {
        let pos = this.getBoxLocation(e.layerX, e.layerY);
        let gridArray = Object.assign({}, this.state.gridArray)
        console.log(this.state.gridArray)
        if (!mousePressed && this.state.gridArray[pos[1]][pos[0]]) {

          
         
          dragToken = this.state.gridArray[pos[1]][pos[0]];
          
          if (dragToken) {
            draggingImage.src = dragToken.imageUrl;
            mousePressed = true;;
            gridArray[pos[1]][pos[0]] = null;
            this.setState({ gridArray })
          }
        } else {
          mousePressed = false;;
          gridArray[pos[1]][pos[0]] = dragToken;
          this.setState({ gridArray }, () => {
            dragToken = null;
            draggingImage.src = null;
            context.clearRect(0, 0, canvas.width, canvas.height);
            this.draw();
          })
         
        }

      })



      canvas.addEventListener('mousemove', (e) => {
        let changedCanvas = document.getElementById('canvas')
        let width = (changedCanvas.width / this.dpr / this.state.col);
        let height = (changedCanvas.height / this.dpr / this.state.row);
        if (mousePressed) {
          context.clearRect(0, 0, changedCanvas.width, changedCanvas.height);

          let x = e.layerX;
          let y = e.layerY;

          context.drawImage(draggingImage, x - width / 2, y - height / 2, width, height)
          this.draw();
        }
      })


      canvas.addEventListener('mouseup', (e) => {
        if (mousePressed) {
          let pos = this.getBoxLocation(e.layerX, e.layerY);
          mousePressed = false;

          let gridArray = this.state.gridArray;
          gridArray[pos[1]][pos[0]] = dragToken;
          this.setState({gridArray}, () => {
            dragToken = null;
            draggingImage.src = null;
            context.clearRect(0, 0, canvas.width, canvas.height);
            this.draw();
          })

          
        }
      })














    } else {
      this.setState({ showInitialEdit: true });
    }


    // setting up the socket
    // const roomId = this.props.match.params.gameId;
    // socket = io(this.ENPOINT);
    // socket.on('connect', () => {
    //   socket.emit('joinRoom', { roomId });
    // });
  }

  componentWillUnmount() {
    this.container = document.getElementById('grid-container');
    this.container.removeEventListener('wheel', this.checkScroll);
  }

  update(value) {
    return (e) => {
      this.setState({ [value]: e.currentTarget.value });
    };
  }

  handleBuildGrid() {
    const img = document.getElementById('board-background');
    img.onload = () => {
      let image = document.getElementById('board-background')
      let canvas = document.getElementById('canvas')
      canvas.style.width = `${image.offsetWidth}px`;
      canvas.style.height = `${image.offsetHeight}px`;

      this.setupCanvas();
      let intRow = parseInt(this.state.row);
      let intCol = parseInt(this.state.col);
      let gridArray = new Array(intRow).fill(null).map(() => new Array(intCol).fill(null));

      this.props.tokens.forEach(token => {
        let x = token.pos.x;
        let y = token.pos.y;
        gridArray[y][x] = token;
      })
        
      

      this.setState({ gridArray, row: intRow, col: intCol }, this.draw);
    };

    
    img.src = this.state.previewUrl ? this.state.previewUrl : this.state.boardBackground;
  }


  checkScrollDirection(event, element, zoomFactor, zoomSpeed) {
    if (checkScrollDirectionIsUp(event)) {
      zoomFactor.zoom += zoomSpeed;
      element.style.zoom = zoomFactor.zoom;
    } else {
      zoomFactor.zoom -= zoomSpeed;
      element.style.zoom = zoomFactor.zoom;
    }
    document.body.style.overflowY = 'hidden';
    document.body.style.overflowX = 'hidden';

    function checkScrollDirectionIsUp(event) {
      if (event.wheelDelta) {
        return event.wheelDelta > 0;
      }
      return event.deltaY < 0;
    }
  }

  checkScroll(e) {
    // e.stopPropagation()
    if (this.state.gridLocked) {
      this.checkScrollDirection(e, this.container, this.zoomContainer, 0.005);
    } else if (e.target === document.getElementById('board-background')) {
      this.checkScrollDirection(e, this.background, this.zoomBackground, 0.005);
    } else {
      this.checkScrollDirection(e, this.grid, this.zoomGrid, 0.005);
    }
  }


  handleLock() {
    this.grid = document.getElementById('grid');

    this.background = document.getElementById('board-background');


    if (this.state.gridLocked) {
      this.grid.addEventListener('wheel', this.checkScroll);
      this.background.addEventListener('wheel', this.checkScroll);


      this.background.addEventListener('dragstart', this.dataTransfer);
      this.background.addEventListener('drag', this.moveBackground);
      this.setState({ gridLocked: false });
    } else {
      this.setState({ gridLocked: true });
      this.background.removeEventListener('wheel', this.checkScroll);
      this.grid.removeEventListener('wheel', this.checkScroll);
      this.background.removeEventListener('dragstart', this.dataTransfer);
      this.background.removeEventListener('drag', this.moveBackground);


      document.body.style.overflowY = 'auto';
      document.body.style.overflowX = 'auto';
    }
  }


  dataTransfer(event) {
    const emptyImg = document.getElementById('empty');
    event.dataTransfer.setDragImage(emptyImg, 0, 0);
  }

  moveBackground(event) {
    this.background.style.transform = `translate(${event.layerX * (1 / this.zoomBackground.zoom) - (this.background.width / 2)}px,${event.layerY * (1 / this.zoomBackground.zoom) - (this.background.height / 2)}px)`;
    // need to check if we need that
    this.posX = event.layerX * (1 / this.zoomBackground.zoom) - (this.background.width / 2);
    this.posY = event.layerY * (1 / this.zoomBackground.zoom) - (this.background.height / 2);
  }


  createBoard() {
    const background = document.getElementById('board-background');

    // another
    const rect = background.getBoundingClientRect();

    // we can try this.posX this.posY

    // const board = {};
    const formData = new FormData();
    formData.append('name', 'test');
    formData.append('gameId', this.props.match.params.gameId);

    formData.append('rows', this.state.row);
    formData.append('cols', this.state.col);
    formData.append('gridZoomFactor', this.zoomGrid.zoom);

    formData.append('offsetX', rect.x);
    formData.append('offsetY', rect.y);
    formData.append('imageZoomFactor', this.zoomBackground.zoom);

    formData.append('gridColor', "#FFF");
    formData.append('opacity', 1);
    formData.append('backgroundImage', this.state.imageFile);

    createBoard(formData)
      .then(() => console.log("TEST"))
      .catch((err)=> console.log(err))
       //.then(console.log, console.log);

    // createBoard from client
  //   const { createBoard } = this.props;
  //   const { row, col, imageFile } = this.state;
  //   createBoard(row, col, this.zoomGrid.zoom, rect.x, rect.y, this.zoomBackground.zoom, imageFile);
  }

  handleImageClick() {
    const file = document.getElementById('image-upload');
    file.click();
  }

  handleImage(e) {
    const img = e.currentTarget.files[0];

    const fileReader = new FileReader();

    fileReader.onloadend = () => {
      this.setState({ imageFile: img, previewUrl: fileReader.result });
    };
    if (img) {
      fileReader.readAsDataURL(img);
    }
  }


  renderBoard() {

    let gridArray = Object.assign({}, this.state.gridArray);

    for(let token in this.props.tokens){
      gridArray[token.pos.x][token.pos.y] = token;
    }

    this.setState({ gridArray });
  }

  renderImage() {
    // if ("https://wallpaperplay.com/walls/full/d/6/8/178663.jpg") {
    //   // console.log(this.state.boardBackground);
    //   return "https://wallpaperplay.com/walls/full/d/6/8/178663.jpg";
    // } else {
    //   if(this.state.previewUrl){
    //     return this.state.previewUrl;
    //   } else {
    //     return null;
    //   }
    // }
    if(this.state.boardBackground) {
      return this.state.boardBackground;
    } else {
      if(this.state.previewUrl){
        return this.state.previewUrl;
      } else {
        return '';
      }
    }
  }

  componentDidUpdate(prevProps) {

    if (!prevProps.create && this.props.create) {
      const state = {
        row: null,
        col: null,
        zoomFactorGrid: null,
        zoomFactorImage: null,
        offSetX: null,
        offSetY: null,
        gridArray: null,
        opacity: null,
        borderColor: null,
        gridLocked: true,
        boardBackground: '',
        showInitialEdit: false,
        previewUrl: null,
      };
      this.setState(state, this.handleBuildGrid);
    }

    if (this.props.board && (!prevProps.board || prevProps.board._id !== this.props.board._id)) {
      const state = {
        row: this.props.board.gridSize.rows,
        col: this.props.board.gridSize.cols,
        zoomFactorGrid: this.props.board.gridSize.gridZoomFactor,
        zoomFactorImage: this.props.board.imageAttributes.imageZoomFactor,
        imagePosX: this.props.board.imageAttributes.offsetX,
        imagePosY: this.props.board.imageAttributes.offsetY,
        opacity: this.props.board.settings.opacity,
        borderColor: this.props.board.settings.gridColor,
        boardBackground: this.props.board.backgroundImageUrl,
      };
      // this.grid = document.getElementById('grid');
      // console.log(this.props.board.gridSize.gridZoomFactor);
      // this.grid.style.zoom = this.props.board.gridSize.gridZoomFactor;
      // this.zoomGrid = { zoom: this.props.board.gridSize.gridZoomFactor };
      // // debugger
      this.setState(state, this.handleBuildGrid);
    }
  }

  componentWillUnmount() {
    this.container = document.getElementById('grid-container');
    this.container.removeEventListener('wheel', this.checkScroll);
  }

/////////////////////////////////////////////////////////////////



draw() {
  this.drawGrid(this.state.row, this.state.col);
}

drawGrid(row, col) {

  // Take canvas and set line width 1pc
  let canvas = document.getElementById('canvas')
  let context = canvas.getContext('2d');
  context.lineWidth = 1;
  // Width of the box is calculated using this formula
  let width = (canvas.width / this.dpr / this.state.col);
  let height = (canvas.height / this.dpr / this.state.row);
  // 
  for (let i = 0; i < row; i++) {
    for (let j = 0; j < col; j++) {

      if (this.state.gridArray[i][j]) {
        let token = this.state.gridArray[i][j]
        let image = new Image();
        image.src = token.imageUrl
        context.drawImage(image, j * width, i * height, width, height);
      }

      context.beginPath();
      context.strokeStyle = "white"
      context.rect(j * width + 0.5, i * height + 0.5, i * width, j * height)
      context.stroke();
    }
  }

}





getBoxLocation(x, y) {
  // Gets location of the mouse click on the canvas
  let canvas = document.getElementById('canvas')
  let boxWidth = (canvas.width / this.dpr / this.state.col);
  let boxHeight = (canvas.height / this.dpr / this.state.row);
  let colPicked = Math.floor(1 + (x / boxWidth));
  let rowPicked = Math.floor(1 + (y / boxHeight));
  return [colPicked - 1, rowPicked - 1];
}



setupCanvas() {
  // Scale canvas properly
  let canvas = document.getElementById('canvas')
  // Get the device pixel ratio, falling back to 1.
  // Get the size of the canvas in CSS pixels.
  var rect = canvas.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * this.dpr;
  canvas.height = rect.height * this.dpr;
  var ctx = canvas.getContext('2d');
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  ctx.scale(this.dpr, this.dpr);
  ctx.lineWidth = 1;
}


setDraggingPiece(token){
  this.draggingPiece = token;
}










































  render() {
    const {
      create, pieces, createPiece, userId, board,
    } = this.props;
    return (
      <div>

        {create ? (
          <div className={styles.initialSetup}>
            <div className={styles.initialInputs}>
              {/* Image
              <input onChange={this.update('imageUrl')} id="image" className={styles.gridInputs} value={imageUrl} type="text" name="" /> */}
              Rows
              <input onChange={this.update('row')} id="row" className={styles.gridInputs} type="text" name="" maxLength="2" />
              Cols
              <input onChange={this.update('col')} id="col" className={styles.gridInputs} type="text" name="" maxLength="2" />
            </div>
            {/* {console.log(this.state.backgroundImage)} */}
            <div className={styles.gridButtons}>
              <button className={styles.setGrid} onClick={this.handleBuildGrid} id="set-grid">Set grid</button>
              <button className={styles.lockButton} onClick={this.handleLock}>{this.state.gridLocked ? 'Unlock grid' : 'Lock grid'}</button>
              <button className={styles.uploadBackground} onClick={this.handleImageClick}>Upload background</button>
              <button className={styles.createBoard} onClick={this.createBoard}>Create board</button>
            </div>

            <input type="file" onChange={this.handleImage} className={styles.imageFile} id="image-upload" />
          </div>
        ) : null}


        <div className={styles.container} id="grid-container">
          <canvas id='canvas'>
          </canvas>

          <div className={styles.imageContainer}>
            <img id="board-background" src={this.renderImage()} draggable="true" className={styles.backgroundImage} />
          </div>

          <img id="empty" src={empty} className={styles.empty} />
        </div>


        {!create ? <TokenBar setDraggingPiece={this.setDraggingPiece} handlePieceDrop={this.handlePieceDrop} pieces={pieces} createPiece={createPiece} userId={userId} board={board} socket={this.props.socket}/> : null}


      </div>
    );
  }
}

export default withRouter(Grid);

/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { withRouter } from 'react-router-dom';
import FormData from 'form-data';
import styles from './grid.module.scss';
import TokenBar from './token_bar';
import { createBoard } from '../../util/boards_api_util';
import SettingWidgetContainer from './widgets/setting_widget_container';
import DeleteTokenWidget from './widgets/delete_token_widget';



class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.handleBuildGrid = this.handleBuildGrid.bind(this);

    this.setGrid = this.setGrid.bind(this)
    this.setFetchedGrid = this.setFetchedGrid.bind(this)

    this.handleLockGrid = this.handleLockGrid.bind(this);
    this.handleLockBackground = this.handleLockBackground.bind(this);
    this.dataTransfer = this.dataTransfer.bind(this);

    this.showHideTokenBar = this.showHideTokenBar.bind(this);

    this.createBoard = this.createBoard.bind(this);
    this.updateBoard = this.updateBoard.bind(this);
    this.update = this.update.bind(this);


    this.handleImage = this.handleImage.bind(this);
    this.handleImageClick = this.handleImageClick.bind(this);

    this.setDraggingPiece = this.setDraggingPiece.bind(this);

    this.highlightToken = this.highlightToken.bind(this);

    this.state = {
      name: "New Board",
      row: 2,
      col: 2,
      zoomFactorGrid: null,
      zoomFactorImage: null,
      offSetX: null,
      offSetY: null,
      gridArray: null,
      opacity: null,
      borderColor: "#ffffff",
      gridLocked: true,
      boardBackground: '',
      showInitialEdit: false,
      previewUrl: null,
      moveGrid: false,
      moveBackground: false,
    };

    this.ENPOINT = 'localhost:5000/gamesNamespace';

    this.dpr = 2;
    this.draggingPiece = null;

    this.backgroundImage = new Image();

    this.zoomGridTEST = 1;
    this.zoomBackground = 1;
    this.imageScreenFactor = 2;
    this.overallZoom = 1;

    this.moveGrid = false;
    this.moveBackground = false;

    this.borderColor = "#ffffff";
    this.borderOpacity = 1;

    this.gridPosX = 0;
    this.gridPosY = 0;

    this.imagePosX = 0;
    this.imagePosY = 0;

    this.overallPosX = 0;
    this.overallPos = 0;

    this.gridWidth = 0;
    this.gridHeight = 0;

    this.gridWidthSetting = 0;
    this.gridHeightSetting = 0;


    this.backgroundWidthSetting = 0;
    this.backgroundHeightSetting = 0;

    this.fetchUser = false;

    this.plusGridWidth = this.plusGridWidth.bind(this)
    this.plusGridHeight = this.plusGridHeight.bind(this)

    this.plusBackgroundWidth = this.plusBackgroundWidth.bind(this)
    this.plusBackgroundHeight = this.plusBackgroundHeight.bind(this)

  }


  showHideTokenBar(e) {
    if (e.pageY > window.innerHeight * 0.8) {
      this.bar.style.display = 'flex';
    } else {
      this.bar.style.display = 'none';
    }
  }

  componentDidMount() {
    this.props.fetchPieces(this.props.userId);

    let canvas = document.getElementById('canvas');





    this.props.fetchUser(this.props.userId)
      .then(() => {
        if (!this.props.create) {
          const state = {
            row: this.props.board.gridSize.rows,
            col: this.props.board.gridSize.cols,
            zoomFactorGrid: this.props.board.gridSize.gridZoomFactor,
            zoomFactorImage: this.props.board.imageAttributes.imageZoomFactor,
            gridPosX: this.props.board.gridSize.gridPosX,
            gridPosY: this.props.board.gridSize.gridPosY,
            imagePosX: this.props.board.imageAttributes.imagePosX,
            imagePosY: this.props.board.imageAttributes.imagePosY,
            opacity: this.props.board.settings.opacity,
            borderColor: this.props.board.settings.gridColor,
            boardBackground: this.props.board.backgroundImageUrl,
            gridWidthSetting: this.props.board.gridSize.width,
            gridHeightSetting: this.props.board.gridSize.height,
            backgroundWidthSetting: this.props.board.imageAttributes.width,
            backgroundHeightSetting: this.props.board.imageAttributes.height,
            color: this.props.users[this.props.userId].color,
            name: this.props.board.name
          };

          this.myColor = state.color


          this.borderColor = state.borderColor;
          this.borderOpacity = state.opacity;

          this.zoomGridTEST = state.zoomFactorGrid;
          this.zoomBackground = state.zoomFactorImage;

          this.gridWidthSetting = state.gridWidthSetting
          this.gridHeightSetting = state.gridHeightSetting

          this.backgroundWidthSetting = state.backgroundWidthSetting
          this.backgroundHeightSetting = state.backgroundHeightSetting

          this.setState(state, this.setFetchedGrid);

          this.bar = document.getElementById('bar-container');
          document.addEventListener('mousemove', this.showHideTokenBar);
          document.addEventListener('dragover', this.showHideTokenBar);
          this.bar.style.display = 'none';


        } else {
          this.setState({ showInitialEdit: true });
        }

      })




    document.addEventListener('dragover', (e) => {
      e.preventDefault();
    })

    canvas.addEventListener("drop", (e) => {
      if (this.draggingPiece) {
        let pos = this.getBoxLocation(e.layerX, e.layerY);

        if ((pos[0] >= 0 && pos[0] < this.state.col) && (pos[1] >= 0 && pos[1] < this.state.row)) {
          this.draggingPiece.pos.x = pos[0];
          this.draggingPiece.pos.y = pos[1];

          let gridArray = this.state.gridArray;
          let image = new Image();
          image.onload = () => {
            gridArray[pos[1]][pos[0]] = [this.draggingPiece, image];
            this.draw();
          }
          image.src = this.draggingPiece.imageUrl;

          this.props.socket.emit('createToken', this.draggingPiece)

          this.setState({ gridArray }, () => {
            this.draggingPiece = null;

          });
        }
      }
    })

    let mousePressed = false;
    let dragToken = null;
    let draggingImage = new Image;

    //puts all objects in canvas properly after resize
    window.onresize = () => {
      this.setupCanvas();
      this.draw();
    };

    let context = canvas.getContext('2d');

    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      let pos = this.getBoxLocation(event.layerX, event.layerY);
      //if the mouse is on the grid
      if ((pos[0] >= 0 && pos[0] < this.state.col) && (pos[1] >= 0 && pos[1] < this.state.row)) {
        if (this.moveGrid) {
          if (checkScrollDirectionIsUp(event)) {
            this.zoomGridTEST += 0.005;
            this.gridPosX -= 1.4;
            this.gridPosY -= 1.2;

          } else {
            if (this.zoomGridTEST > 0) {
              this.zoomGridTEST -= 0.005;
              this.gridPosX += 1.4;
              this.gridPosY += 1.2;
            }
          }

        }
      }

      if (this.moveBackground) {
        if (checkScrollDirectionIsUp(event)) {
          this.zoomBackground += 0.005;
          this.imagePosX -= 1.4;
          this.imagePosY -= 1.2;

        } else {
          this.zoomBackground -= 0.005;
          this.imagePosX += 1.4;
          this.imagePosY += 1.2;

        }
      }



      context.clearRect(0, 0, canvas.width, canvas.height);
      this.draw();


      function checkScrollDirectionIsUp(event) {
        if (event.wheelDelta) {
          return event.wheelDelta > 0;
        }
        return event.deltaY < 0;
      }
    })

    canvas.addEventListener('mousedown', (e) => {
      if (!this.moveGrid && !this.moveBackground) {

        let pos = this.getBoxLocation(e.layerX, e.layerY);

        if ((pos[0] >= 0 && pos[0] < this.state.col) && (pos[1] >= 0 && pos[1] < this.state.row)) {

          let gridArray = Object.assign({}, this.state.gridArray)
          if (!mousePressed && this.state.gridArray[pos[1]][pos[0]]) {

            dragToken = this.state.gridArray[pos[1]][pos[0]][0];

            if (dragToken) {
              draggingImage.src = dragToken.imageUrl;
              mousePressed = true;;
              gridArray[pos[1]][pos[0]] = null;
              this.setState({ gridArray })
            }
          } else {
            mousePressed = false;
            if (dragToken) {
              let image = new Image();
              image.src = dragToken.imageUrl;
              gridArray[pos[1]][pos[0]] = [dragToken, image];
              this.setState({ gridArray }, () => {
                dragToken = null;
                draggingImage.src = "";
                context.clearRect(0, 0, canvas.width, canvas.height);
                this.draw();
              })
            }

          }
        }
      } else {
        if (mousePressed) {
          mousePressed = false;
          if (this.moveGrid) {
            this.gridPosX = e.layerX;
            this.gridPosY = e.layerY;
          }
          if (this.moveBackground) {
            this.imagePosX = e.layerX;
            this.imagePosY = e.layerY;
          }

          this.moveGrid = false;
          this.moveBackground = false;
        } else {
          mousePressed = true;
        }
      }

    })

    canvas.addEventListener('mousemove', (event) => {
      let pos = this.getBoxLocation(event.layerX, event.layerY);

      if ((pos[0] >= 0 && pos[0] < this.state.col) && (pos[1] >= 0 && pos[1] < this.state.row)) {
        if (!this.moveGrid && !this.moveBackground) {
          let canvas = document.getElementById('canvas')
          let width = (this.gridWidth - this.gridWidthSetting) * this.zoomGridTEST;
          let height = (this.gridHeight - this.gridHeightSetting) * this.zoomGridTEST;
          if (mousePressed) {
            context.clearRect(0, 0, canvas.width, canvas.height);

            let x = event.layerX;
            let y = event.layerY;

            this.draw();
            context.drawImage(draggingImage, x - width / 2, y - height / 2, width, height)
          }
        }
      }

      if (this.moveGrid) {
        if (mousePressed) {
          let x = event.layerX;
          let y = event.layerY;
          this.gridPosX = x;
          this.gridPosY = y;
          context.clearRect(0, 0, canvas.width, canvas.height);
          this.draw('gridDrag');
        }
      }

      if (this.moveBackground) {
        if (mousePressed) {
          let x = event.layerX;
          let y = event.layerY;

          this.imagePosX = x;
          this.imagePosY = y;
          context.clearRect(0, 0, canvas.width, canvas.height);
          this.draw('backgroundDrag');
        }
      }

    })

    canvas.addEventListener('mouseup', (e) => {
      if (!this.moveGrid && !this.moveBackground && !this.props.create) {

        if (mousePressed) {
          let pos = this.getBoxLocation(e.layerX, e.layerY);
          if ((pos[0] >= 0 && pos[0] < this.state.col) && (pos[1] >= 0 && pos[1] < this.state.row)) {
            mousePressed = false;

            let gridArray = this.state.gridArray;
            dragToken.pos.x = pos[0];
            dragToken.pos.y = pos[1];
            let image = new Image();
            image.src = dragToken.imageUrl;
            gridArray[pos[1]][pos[0]] = [dragToken, image];


            this.setState({ gridArray }, () => {
              this.props.socket.emit('updateToken', dragToken)
              dragToken = null;
              draggingImage.src = "";
              context.clearRect(0, 0, canvas.width, canvas.height);
              this.draw();

            })
          }
        }
      } else {

        if (mousePressed) {

          let imageWidth = (this.backgroundImage.naturalWidth / this.imageScreenFactor - this.backgroundWidthSetting) * this.zoomBackground;
          let imageHeight = (this.backgroundImage.naturalHeight / this.imageScreenFactor - this.backgroundHeightSetting) * this.zoomBackground;

          let width = (this.gridWidth - this.gridWidthSetting) * this.zoomGridTEST;
          let height = (this.gridHeight - this.gridHeightSetting) * this.zoomGridTEST;


          let totalWidth = width * this.state.col;
          let totalHeight = height * this.state.row;

          mousePressed = false;

          if (this.moveGrid) {
            this.gridPosX = e.layerX - totalWidth / 2;
            this.gridPosY = e.layerY - totalHeight / 2;
          }

          if (this.moveBackground) {
            this.imagePosX = e.layerX - imageWidth / 2;
            this.imagePosY = e.layerY - imageHeight / 2;

          }
        }

      }
    })
  }

  update(value) {
    return (e) => {
      if (value === "row" || value === "col") {
        if (e.currentTarget.value <= 0 || e.currentTarget.value === null) {
          this.setState({ [value]: 1 }, this.setGrid);
        } else {
          this.setState({ [value]: parseInt(e.currentTarget.value) }, this.setGrid);
        }
      } else if(value === "name"){
          this.setState({ [value]: e.currentTarget.value });
      } else {
        if (value === "borderColor") {
          this.borderColor = e.currentTarget.value;
        }
        if (value === "borderOpacity") {
          this.borderOpacity = e.currentTarget.value;
        }

        if (value === "myColor") {
          this.myColor = e.currentTarget.value;
        }

        if (this.state.previewUrl || !this.props.create) {
          
          this.setState({});
          let canvas = document.getElementById('canvas')
          let context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);
          this.draw();
        }
      }


    };
  }

  handleBuildGrid() {

    this.setupCanvas();
    let intRow;
    let intCol;
    let gridArray;
    if (this.state.row && this.state.col) {
      intRow = this.state.row;
      intCol = this.state.col;

      gridArray = new Array(intRow).fill(null).map(() => new Array(intCol).fill(null));
    }

    for (let token of this.props.tokens) {
      let x = token.pos.x;
      let y = token.pos.y;
      let image = new Image();

      image.onload = () => {
        gridArray[y][x] = [token, image];
      }
      image.src = token.imageUrl;
    }

    let loaded = false;

    let loadInterval = setInterval(() => {
      loaded = true;

      this.props.tokens.forEach(token => {
        let x = token.pos.x;
        let y = token.pos.y;
        if (!gridArray[y][x]) {
          loaded = false;
        }
      })

      if (loaded) {
        clearInterval(loadInterval)
        this.setState({ gridArray, row: intRow, col: intCol }, this.draw);
      }
    }, 10)
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
    if (this.state.gridLocked) {
      this.checkScrollDirection(e, this.container, this.zoomContainer, 0.005);
    } else if (e.target === document.getElementById('board-background')) {
      this.checkScrollDirection(e, this.background, this.zoomBackground, 0.005);
    } else {
      this.checkScrollDirection(e, this.grid, this.zoomGrid, 0.005);
    }
  }


  handleLockGrid() {
    this.moveGrid = !this.moveGrid;
    this.moveBackground = false;
    this.setState({ moveGrid: this.moveGrid, moveBackground: false })
  }
  handleLockBackground() {
    this.moveGrid = false;
    this.moveBackground = !this.moveBackground;
    this.setState({ moveGrid: false, moveBackground: this.moveBackground })
  }

  dataTransfer(event) {
    const emptyImg = document.getElementById('empty');
    event.dataTransfer.setDragImage(emptyImg, 0, 0);
  }

  createBoard() {
    if (this.state.previewUrl) {
      const formData = new FormData();
      formData.append('name', this.state.name);
      formData.append('gameId', this.props.match.params.gameId);

      formData.append('rows', this.state.row);
      formData.append('cols', this.state.col);
      formData.append('gridZoomFactor', this.zoomGridTEST);

      let gridPosX = this.gridPosX;
      let gridPosY = this.gridPosY;

      let imagePosX = this.imagePosX;
      let imagePosY = this.imagePosY;

      let gridWidth = this.gridWidthSetting;
      let gridHeight = this.gridHeightSetting;

      let backgroundWidth = this.backgroundWidthSetting;
      let backgroundHeight = this.backgroundHeightSetting;

      formData.append('gridWidth', gridWidth);
      formData.append('creatorId', this.props.userId);
      formData.append('gridHeight', gridHeight);

      formData.append('backgroundWidth', backgroundWidth);
      formData.append('backgroundHeight', backgroundHeight);

      formData.append('gridPosX', gridPosX);
      formData.append('gridPosY', gridPosY);

      formData.append('imagePosX', imagePosX);
      formData.append('imagePosY', imagePosY);

      formData.append('imageZoomFactor', this.zoomBackground);

      formData.append('gridColor', this.borderColor);
      formData.append('opacity', this.borderOpacity);
      formData.append('backgroundImage', this.state.imageFile);

      createBoard(formData)

      this.moveGrid = false;
      this.moveBackground = false;
    }
  }

  handleImageClick() {
    const file = document.getElementById('image-upload');
    file.click();
  }

  handleImage(e) {
    const img = e.currentTarget.files[0];

    const fileReader = new FileReader();

    fileReader.onloadend = () => {
      this.setState({ imageFile: img, previewUrl: fileReader.result }, this.setGrid);
    };
    if (img) {
      fileReader.readAsDataURL(img);
    }
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
    if (this.state.boardBackground) {
      return this.state.boardBackground;
    } else {
      if (this.state.previewUrl) {
        return this.state.previewUrl;
      } else {
        return '';
      }
    }
  }

  componentDidUpdate(prevProps) {
    let canvas = document.getElementById('canvas');

    if(this.fetchUser){
      this.fetchUser = false;
      this.props.fetchUser(this.props.userId)
        .then(() => {
          if ((this.props.board && (!prevProps.board || prevProps.board._id !== this.props.board._id)) || this.props.update) {
            this.props.resetUpdate();
            this.bar = document.getElementById('bar-container');
            document.addEventListener('mousemove', this.showHideTokenBar);
            document.addEventListener('dragover', this.showHideTokenBar);
            this.bar.style.display = 'none';

            const state = {
              row: this.props.board.gridSize.rows,
              col: this.props.board.gridSize.cols,
              zoomFactorGrid: this.props.board.gridSize.gridZoomFactor,
              zoomFactorImage: this.props.board.imageAttributes.imageZoomFactor,
              gridPosX: this.props.board.gridSize.gridPosX,
              gridPosY: this.props.board.gridSize.gridPosY,
              imagePosX: this.props.board.imageAttributes.imagePosX,
              imagePosY: this.props.board.imageAttributes.imagePosY,
              opacity: this.props.board.settings.opacity,
              borderColor: this.props.board.settings.gridColor,
              boardBackground: this.props.board.backgroundImageUrl,
              gridWidthSetting: this.props.board.gridSize.width,
              gridHeightSetting: this.props.board.gridSize.height,
              backgroundWidthSetting: this.props.board.imageAttributes.width,
              backgroundHeightSetting: this.props.board.imageAttributes.height,
              color: this.props.users[this.props.userId].color,
              name: this.props.board.name
            };

            this.myColor = state.color


            this.zoomGridTEST = state.zoomFactorGrid;
            this.zoomBackground = state.zoomFactorImage;

            this.gridWidthSetting = state.gridWidthSetting
            this.gridHeightSetting = state.gridHeightSetting

            this.backgroundWidthSetting = state.backgroundWidthSetting
            this.backgroundHeightSetting = state.backgroundHeightSetting

            this.borderColor = state.borderColor;
            this.borderOpacity = state.opacity;

            this.setState(state, this.setFetchedGrid);
          }

        })
    }





    if (!prevProps.create && this.props.create) {
      const state = {
        row: 2,
        col: 2,
        zoomFactorGrid: null,
        zoomFactorImage: null,
        gridPosX: null,
        gridPosY: null,
        imagePosX: null,
        imagePosY: null,
        gridArray: null,
        opacity: null,
        borderColor: "#ffffff",
        gridLocked: true,
        boardBackground: '',
        showInitialEdit: false,
        previewUrl: null,
        name: "New Board"
      };

      this.zoomGridTEST = 1;
      this.zoomBackground = 1;

      this.gridWidthSetting = 0;
      this.gridHeightSetting = 0;


      this.backgroundWidthSetting = 0;
      this.backgroundHeightSetting = 0;

      this.borderColor = "#ffffff";
      this.borderOpacity = 1;

      this.myColor = "#808080"

      this.setState(state, () => {

        let context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

      });
    }

  }

  draw(action = null) {
    this.drawGrid(this.state.row, this.state.col, action);
  }

  drawGrid(row, col, action) {
    // Take canvas and set line width 1pc
    let canvas = document.getElementById('canvas')
    let context = canvas.getContext('2d');


    let imageWidth = (this.backgroundImage.naturalWidth / this.imageScreenFactor - this.backgroundWidthSetting) * this.zoomBackground;
    let imageHeight = (this.backgroundImage.naturalHeight / this.imageScreenFactor - this.backgroundHeightSetting) * this.zoomBackground;

    let width = (this.gridWidth - this.gridWidthSetting) * this.zoomGridTEST;
    let height = (this.gridHeight - this.gridHeightSetting) * this.zoomGridTEST;

    let totalWidth = width * col;
    let totalHeight = height * row;

    if (action === 'backgroundDrag') {
      context.drawImage(this.backgroundImage, this.imagePosX - imageWidth / 2, this.imagePosY - imageHeight / 2, imageWidth, imageHeight)
    } else {
      context.drawImage(this.backgroundImage, this.imagePosX, this.imagePosY, imageWidth, imageHeight)
    }

    if (this.state.row && this.state.col) {
      for (let i = 0; i < row; i++) {
        for (let j = 0; j < col; j++) {

          if (this.state.gridArray[i][j]) {
            let image = this.state.gridArray[i][j][1]
            let boxBorder = Math.floor(4 * (width / height))
            context.lineWidth = boxBorder;
            if (action === "gridDrag") {
              context.drawImage(image, (j * width + this.gridPosX) - totalWidth / 2, (i * height + this.gridPosY) - totalHeight / 2, width, height);
            } else {
              context.beginPath();
              context.drawImage(image, j * width + this.gridPosX, i * height + this.gridPosY, width, height);
              if (action && action.highlight) {
                if (action.token.pos.x === j && action.token.pos.y === i) {
                  context.fillStyle = this.myColor;
                  context.globalAlpha = 0.5;
                  context.fillRect(j * width + this.gridPosX + boxBorder - 2, i * height + this.gridPosY + boxBorder - 1, width - boxBorder, height - boxBorder);
                  context.globalAlpha = 1;
                } else {
                  context.strokeStyle = this.myColor;
                }
              }
              context.strokeStyle = this.myColor;
              context.rect(j * width + this.gridPosX + boxBorder - 2, i * height + this.gridPosY + boxBorder - 1, width - boxBorder, height - boxBorder);
              context.stroke();
            }
          }


          context.lineWidth = 1;
          context.beginPath();
          context.strokeStyle = this.borderColor;
          context.globalAlpha = this.borderOpacity;
          if (action === 'gridDrag') {
            context.rect((j * width + 0.5 + this.gridPosX) - totalWidth / 2, (i * height + 0.5 + this.gridPosY) - totalHeight / 2, width, height)
          } else {
            context.rect(j * width + 0.5 + this.gridPosX, i * height + 0.5 + this.gridPosY, width, height)
          }
          context.stroke();
          context.globalAlpha = 1;
        }
      }
    }
  }

  getBoxLocation(x, y) {
    // Gets location of the mouse click on the canvas
    let boxWidth = (this.gridWidth - this.gridWidthSetting) * this.zoomGridTEST;
    let boxHeight = (this.gridHeight - this.gridHeightSetting) * this.zoomGridTEST;

    let colPicked = Math.floor(((x - this.gridPosX) / boxWidth));
    let rowPicked = Math.floor(((y - this.gridPosY) / boxHeight));
    return [colPicked, rowPicked];
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

  setDraggingPiece(token) {
    this.draggingPiece = token;
  }

  setGrid() {

    if (this.state.previewUrl && this.state.col && this.state.row) {
      this.backgroundImage.src = this.state.boardBackground ? this.state.boardBackground : this.state.previewUrl;
      this.backgroundImage.onload = () => {

        let imageWidth = this.backgroundImage.naturalWidth / this.imageScreenFactor;
        let imageHeight = this.backgroundImage.naturalHeight / this.imageScreenFactor;
        this.gridWidth = (imageWidth / this.state.col);
        this.gridHeight = (imageHeight / this.state.row);


        let canvas = document.getElementById('canvas')

        this.imagePosX = (canvas.offsetWidth - imageWidth) / 2;
        this.imagePosY = (canvas.offsetHeight - imageHeight) / 2;

        this.gridPosX = this.imagePosX;
        this.gridPosY = this.imagePosY;

        console.log(this.state.row, this.state.col)
        this.handleBuildGrid();
      }
    }
  }


  setFetchedGrid() {
    this.backgroundImage.src = this.state.boardBackground ? this.state.boardBackground : this.state.previewUrl;
    this.backgroundImage.onload = () => {

      let imageWidth = this.backgroundImage.naturalWidth / this.imageScreenFactor;
      let imageHeight = this.backgroundImage.naturalHeight / this.imageScreenFactor;

      this.gridWidth = (imageWidth / this.state.col);
      this.gridHeight = (imageHeight / this.state.row);

      this.gridPosX = this.state.gridPosX;
      this.gridPosY = this.state.gridPosY;

      this.imagePosX = this.state.imagePosX;
      this.imagePosY = this.state.imagePosY;

      this.handleBuildGrid();
    }
  }

  plusGridWidth(value) {
    let canvas = document.getElementById('canvas')
    let context = canvas.getContext('2d');

    this.gridWidthSetting += value;

    context.clearRect(0, 0, canvas.width, canvas.height);
    this.draw();
  }
  plusGridHeight(value) {
    let canvas = document.getElementById('canvas')
    let context = canvas.getContext('2d');

    this.gridHeightSetting += value;

    context.clearRect(0, 0, canvas.width, canvas.height);
    this.draw();
  }
  plusBackgroundWidth(value) {
    let canvas = document.getElementById('canvas')
    let context = canvas.getContext('2d');

    this.backgroundWidthSetting += value;

    context.clearRect(0, 0, canvas.width, canvas.height);
    this.draw();
  }
  plusBackgroundHeight(value) {
    let canvas = document.getElementById('canvas')
    let context = canvas.getContext('2d');

    this.backgroundHeightSetting += value;

    context.clearRect(0, 0, canvas.width, canvas.height);
    this.draw();
  }

  updateBoard() {

    this.fetchUser = true;
    let newBoard = {};

    let gridSize = {};
    let imageAttributes = {};
    let settings = {}



    gridSize["gridZoomFactor"] = this.zoomGridTEST;
    gridSize["gridPosX"] = this.gridPosX;
    gridSize["gridPosY"] = this.gridPosY;
    gridSize["width"] = this.gridWidthSetting;
    gridSize["height"] = this.gridHeightSetting;
    gridSize["cols"] = this.state.col
    gridSize["rows"] = this.state.row


    imageAttributes["imagePosX"] = this.imagePosX;
    imageAttributes["imagePosY"] = this.imagePosY;
    imageAttributes["width"] = this.backgroundWidthSetting;
    imageAttributes["height"] = this.backgroundHeightSetting;
    imageAttributes["imageZoomFactor"] = this.zoomBackground;

    settings['gridColor'] = this.borderColor;
    settings['opacity'] = this.borderOpacity;


    newBoard["_id"] = this.props.board._id
    if(this.state.name.length !== 0){
      newBoard["name"] = this.state.name
    }else{
      newBoard["name"] = "New Board"
    }
    newBoard["gridSize"] = gridSize;
    newBoard["imageAttributes"] = imageAttributes;
    newBoard["settings"] = settings;
    newBoard["color"] = this.myColor;
    newBoard["userId"] = this.props.userId;


    this.props.socket.emit('updateBoard', newBoard)
    this.props.socket.emit('updated')
  }

  highlightToken(token) {
    let canvas = document.getElementById('canvas')
    let context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (token) {
      this.draw({ highlight: true, token })
    } else {
      this.draw();
    }
  }


  render() {
    const {
      create, pieces, createPiece, userId, board, settingActive, deleteActive, toggleWidget, socket, tokens
    } = this.props;
    return (
      <div>

        <SettingWidgetContainer
          x={260}
          y={42}
          active={settingActive}
          toggleWidget={toggleWidget}
          plusGridWidth={this.plusGridWidth}
          plusGridHeight={this.plusGridHeight}
          plusBackgroundWidth={this.plusBackgroundWidth}
          plusBackgroundHeight={this.plusBackgroundHeight}
          handleLockGrid={this.handleLockGrid}
          handleLockBackground={this.handleLockBackground}
          moveGrid={this.moveGrid}
          moveBackground={this.moveBackground}
          updateBoard={this.updateBoard}
          update={this.update}
          create={create}
          setGrid={this.setGrid}
          handleImageClick={this.handleImageClick}
          createBoard={this.createBoard}
          rows={this.state.row}
          cols={this.state.col}
          borderColor={this.borderColor}
          borderOpacity={this.borderOpacity}
          myColor={this.myColor}
          name={this.state.name}
        />

        {this.state.gridArray ? 
          <DeleteTokenWidget
            x={260}
            y={42}
            active={deleteActive}
            toggleWidget={toggleWidget}
            socket={socket}
            tokens={tokens}
            highlightToken={this.highlightToken}
          />
        : null}

        {create ? (
          <input type="file" onChange={this.handleImage} className={styles.imageFile} id="image-upload" />
        ) : null}

        <div className={styles.container} id="grid-container">
          <canvas id='canvas'>
          </canvas>
        </div>

        {!create ? <TokenBar setDraggingPiece={this.setDraggingPiece} handlePieceDrop={this.handlePieceDrop} pieces={pieces} createPiece={createPiece} userId={userId} board={board} socket={this.props.socket} tokens={this.props.tokens} toggleWidget={toggleWidget} /> : null}


      </div>
    );
  }
}

export default withRouter(Grid);

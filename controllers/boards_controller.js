const Board = require('../models/Board');
const validateBoardRegister = require('../validations/board_validation');
const app = require('../app') 



exports.fetchBoard = function(req, res) { 
    // console.log('user is fetching')
  const boardId = req.params.id; 
  Board.findById(boardId, function(err, board) {
    if (!board) return res.json({msg: 'no board found'}); 
    res.json(board); 
  })
}

//board creating
exports.createBoard = function (req, res) {
    //check boards validations
    
    const {errors,isValid} = validateBoardRegister(req.body);
    
    if (!isValid) {
        return res.status(400).json(errors);
    }
    
    let gridSize = {
        rows: req.body.rows,
        cols: req.body.cols,
        gridZoomFactor: req.body.gridZoomFactor
    };


    let imageAttributes = {
        offsetX: req.body.offsetX,
        offsetY: req.body.offsetY,
        imageZoomFactor: req.body.imageZoomFactor
    }

    let settings={ 
        gridColor: req.body.gridColor,
        opacity: req.body.opacity,
    }


    const newBoard = new Board({
        gameId: req.body.gameId,
        name: req.body.name,
        gridSize: gridSize,
        backgroundImageUrl: req.file.location,
        imageAttributes: imageAttributes,
        settings: settings
    })

    return newBoard.save().then(board => {
        app.transmitData(`${newBoard.gameId}`, 'boardUpdated', board)
    });

}         
 

//board deleting
exports.deleteBoard = function (board) {

    //find the board by id and delete it
    Board.findById(board.id, (err, result) => {
        if(result && result.remove() ) {
            //transmits board.id
            app.transmitData(`${result.gameId}`, 'boardDeleted', board)
        } else {
            app.transmitData(`${result.gameId}`, 'error', err)
        }
    })
   
}

//update the board
exports.updateBoard = function (board) {
    //find the board by id and update it
    //needs to be changed to findOneAndUpdate
    Board.findByIdAndUpdate( { _id: board._id }, { ...board }, (err, result) => {
        if(result) {
            //returns board document = result may need .toJSON()
            app.transmitData(`${result.gameId}`, 'boardUpdated', result)
        } else {
            // console.log(err)
            app.transmitData(`${board.gameId}`, 'error', err)
        }
    })
}

//create token
exports.createToken = function (req, res) {
    let token = req.body
    Board.findById(token.boardId , (err, board) => {
        if(board) {
            //const newToken = new Board.TokenSchema({... token})
            board.tokens.push(token)
            //why are we saving here and not updating above
            const updatedBoard = board.save()
                .then(board =>  app.transmitData(`${updatedBoard.gameId}`, 'tokenUpdated', board.tokens[board.tokens.length - 1]))
            return res.status(200).json(["Token created"])
        } else {
            throw err
        }
    })
}

//edit token
// exports.editToken = function (token) { 
//     //debugger
//     //find the board and update the token
//     //5ec07801dd806c1964996048
//     //Board.findOne({ _id: "5ebed3ef3dda9e104684bff1", "tokens._id": "5ec077cf92f9c218fd54fabe" }).then(console.log)
//     Board.findOneAndUpdate(
//         { _id: "5ebed3ef3dda9e104684bff1", "tokens._id": "5ec07801dd806c1964996048" }, 
//         {
//         "tokens.$": {
//             "pos": {
//                 "x": token.pos.x,
//                 "y": token.pos.y
//             },
//             "size": token.size,
//             "player": token.player
//         }
//     }, (err, doc) => {
//         debugger
//         if (doc) {
//             //returns updated token
//             const resToken = board.tokens.id(board.tokenId)
//             console.log(resToken)
//             //app.transmitData(`${board.gameId}`, 'tokenUpdated', resToken)
//         } else {
//             throw err
//         }
//     })
// }

exports.editToken = function (token) {

    //find the board and update the token
    Board.findOne({ _id: token.boardId}, (err, res) => {
        if (res) {
            const editedToken = res.tokens.id(token.tokenId)
            
            editedToken.pos.x = token.pos.x
            editedToken.pos.y = token.pos.y
            editedToken.imageUrl = token.imageUrl 
            editedToken.player = token.player
            editedToken.boardId = token.boardId
            editedToken.pieceId = token.pieceId
            debugger
        
            res.save().then(res => app.transmitData(`${res.gameId}`, 'tokenUpdated', res.tokens.id(token.tokenId)))
        } else {
            throw err
        }
    })

}



//delete token
exports.deleteToken = function (token) {
    //find the board by id and delete it
    Board.findOne({_id: token.boardId}, (err, board) => {
        if(board) {
            board.tokens.id(board.tokenId).remove()
            board.save()
            app.transmitData(`${board.gameId}`, 'tokenDeleted', token)
        } else {
            throw err
        }
    })
}

import { connect } from 'react-redux';
import CreateGame from './create_game';
import { createGame } from '../../actions/games_actions';

const mapStateToProps = (state) => ({
  creatorId: state.session.userId,
  errors: state.errors.games,
});

const mapDispatchToProps = (dispatch) => ({
  createGame: (game) => dispatch(createGame(game)),
});

export default connect(mapStateToProps, mapDispatchToProps)(CreateGame);

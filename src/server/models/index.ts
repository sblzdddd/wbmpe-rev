import Users from './Users';
import UserAuth, { type UserAuthDocument } from './UserAuth';
import UserSubscriptions from './UserSubscriptions';
import Songs from './Songs';
import Artists from './Artists';
import Albums from './Albums';
import Playlists from './Playlists';
import Streams from './Streams';
import Lyrics from './Lyrics';
import logger from '../utils/BakaLogger';

export { Users, UserAuth, type UserAuthDocument, UserSubscriptions, Songs, Artists, Albums, Playlists, Streams, Lyrics }

console.log(Users, UserAuth, UserSubscriptions, Songs, Artists, Albums, Playlists, Streams, Lyrics)

logger.log('success', "Models have been loaded", {service: 'Mongoose'})

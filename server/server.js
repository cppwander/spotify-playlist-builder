const express = require('express');
const path = require('path');
const spotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8888; //tries .env.PORT, or defaults to 8888

app.listen(port, () => {
  console.log("Server running on http://localhost:8888");
});

const spotifyAPI = new spotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
});


// --- Middleware Setup ---
// Enable Express to parse JSON formatted request bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req,res)=>{
    if (spotifyAPI.getAccessToken())
        res.redirect('/app.html');
    else
        res.sendFile(path.join(__dirname,'..','public','login.html'));
})

app.get('/login', (req,res)=>{
    const scopes = ['playlist-modify-private', 'playlist-modify-public', 'user-read-private', 'user-read-email'];
    res.redirect(spotifyAPI.createAuthorizeURL(scopes));
})

app.get('/callback', (req,res)=>{
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;

    if (error){
        console.error('Error: ', error);
        res.send(`Error: ${error}`);
        return;
    }

    spotifyAPI.authorizationCodeGrant(code)
    .then(
        function(data){
            const accessToken = data.body['access_token'];
            const refreshToken = data.body['refresh_token'];
            const expiresIn = data.body['expires_in'];

            spotifyAPI.setAccessToken(accessToken);
            spotifyAPI.setRefreshToken(refreshToken);
            res.redirect('http://localhost:3000/app');
            console.log('Successful login to Spotify');

            setInterval(async()=>{
                const data = await spotifyAPI.refreshAccessToken();
                const accessTokenRefreshed = data.body['access_token'];
                spotifyAPI.setAccessToken(accessTokenRefreshed);
            }, expiresIn/2*1000);
        }).catch(function(err){
            console.error('Error: ', err);
            res.send('Error getting token');
        })
})

app.post('/create-artists-playlist', async (req,res)=>{
    const artists = req.body.artists;
    const numSongs = req.body.numSongs;
    const playlistName = req.body.playlistName;
    const trackUris = [];
    try{
    //for each artist, get their specified number of top tracks and push into trackUris
    for (const artistName of artists){
        try{
            console.log(`--- Now searching for: "${artistName}" ---`);
            const artistID = await getArtistID(artistName);
            if (artistID){
                const topTracksData = await getArtistTopTracks(artistID, numSongs);
                if (topTracksData){
                    const tracks = topTracksData.body.tracks.slice(0, numSongs); //slice(start, end)
                    tracks.forEach(function(track){
                        trackUris.push(track.uri);
                })
            }
        }
        }
        catch (err){
            console.log(`Skipping artist ${artistName} due to error`, err);
        }
    }

    //create public? playlist
        const createPlaylistResponse = await spotifyAPI.createPlaylist(playlistName, { 'description': '', 'public': 'true'});
        const playlistID = createPlaylistResponse.body.id;
        //add songs
        await spotifyAPI.addTracksToPlaylist(playlistID, trackUris);
        res.status(201).send({
            message: "Playlist created successfully!",
            url: createPlaylistResponse.body.external_urls.spotify
        })
    }
    catch (err){
        console.error('Error creating playlist or adding songs.', err);
        res.status(500).send({ message: 'An error occurred while creating the playlist.' });
    }
})

async function getArtistID(artistName){
    try{
        const data = await spotifyAPI.searchArtists(artistName, {limit: 2, offset: 0});
        if (data.body.artists.items.length === 0){
            console.log(`No artist found for ${artistName}`);
            return null;
        }
        const artistID = data.body.artists.items[0].id;
        //debug
        console.log(data.body.artists.items[0].name);
        return artistID;
    }
    catch(err){
        console.error('Error upon searching for artist ID', err);
        return null;
    }
}

async function getArtistTopTracks(artistID){
    try{
        const data = await spotifyAPI.getArtistTopTracks(artistID, 'US');
        return data;
    }
    catch(err){
        console.error('Error upon searching for artist top tracks', err);
        return null;
    }
}

import {useState} from 'react';

function AppPage(){
    const [artists, setArtists] = useState('');
    const [playlistName, setPlaylistName] = useState('');
    const [numSongs, setNumSongs] = useState(0);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const artistList = artists.split(',').map(artist => artist.trim());

        const formAnswersObject = {
                artists: artistList,
                playlistName,
                numSongs
            };
        console.log(formAnswersObject);
        
        const response = await fetch('/create-artists-playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formAnswersObject)
        });

        const parsedResponse = await response.json();
        if (response.ok) {
            setMessage(`Playlist created! <a href="${parsedResponse.url}" target="_blank"> View it on Spotify.</a>`);
        } 
        else {
            setMessage(`Error: ${parsedResponse.message}`);
        }
    };

    return (
        <div className="container">
            <h1>
                Welcome to Spotify Playlist Builder!
            </h1>
            <p>Successful login.</p>
            <form onSubmit={handleSubmit}>
                <label>Enter what artists you would like in your playlist (separated by commas): </label>
                    <textarea value = {artists} onChange={(e) => setArtists(e.target.value)} required />
                        <br /> <br />
                    <label>Playlist Name: </label>
                    <input type="text" value={playlistName} onChange = {(e) => setPlaylistName(e.target.value)} required />
                        <br /> <br />
                    <label># of Songs per Artist: </label>
                    <input type="number" value={numSongs} onChange = {(e) => setNumSongs(parseInt(e.target.value))} min="1" max="10" />
                        <br /> <br />
                    <button type="submit">Create Playlist</button>
            </form>

            <div className = "innerhtml" dangerouslySetInnerHTML={{ __html: message }} />
        </div>
    );
}

export default AppPage;
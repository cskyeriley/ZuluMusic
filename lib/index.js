// Zulu Music
// Download music easily from Jamendo
// This app is open source and is free. If you paid for this, get your money back
// If you modify this source code, please make it public!
// This is my first experience with javascript, so don't judge =)

// ~Steven Viola
//-------------------------------------------------------------------

// Global variables for keeping track of breadcrumbs
var bc_links = new Array();
var bc_names = new Array();
bc_links[0] = "getRecentShows()";
bc_names[0] = "Home";
var state = {
    "main": {
        "show": function(){
            getRecentAlbums();
        },
        "scroll": 0
    },
    "artist": {
        "show": function(){
            console.log(this.id, this.name);
            bc_links[2] = "getArtistInfo('"+this.id+"')"; 
            bc_names[2] = this.name;
            getArtistInfo(this.id);            
        },
        "id": "",
        "name": ""
    },
    "album": {
        "show": function(){
            console.log(this.id);
            getAlbumInfo(this.id);
        },
        "id": ""
    },
    "search": {
        "show": function(){
            console.log(this.query);
            searchShow(this.query);
        },
        "query": ""
    }
};

// When onload, create the divs for all the different parts of the site
window.onload = function initPage() {
    if(_.indexOf(bt.stash.keys(), "state") !== -1){
        $.each(JSON.parse(bt.stash.get("state")), function(context, properties){
            $.each(properties, function(key, value){
                console.log(context, key, value);
                state[context][key] = value;
            });
        });
    }
	$("<div id='breadcrumb'></div>").appendTo('#main');
	displayBreadcrumbs();
	$("<div id='albums' class='center'></div>").appendTo('#main');
	$("<div id='searchWrapper'></div>").appendTo('#main');
	$("<ul id='gallery'></ul>").appendTo('#main');
	$("<div id='footer'></div>").appendTo('#main');
	renderFooter();
    if(_.indexOf(bt.stash.keys(), "context") !== -1){
        state[bt.stash.get("context")].show();
    } else {
        getRecentAlbums();
    }	
    $(window).scroll(function(){
        if(bt.stash.get("context") === "main"){
            state.main.scroll = $(window).scrollTop();
            bt.stash.set("state", JSON.stringify(state));
        }
    });
}
// Gets the first 50 popular albums of the week and displays them in a gallery with album art
function getRecentAlbums() {
    bt.stash.set("context", "main");
	displayBreadcrumbs();
	$("#albums").empty(); /* Empty the albums div to make sure old content is purged and not displayed */
	$("#gallery").empty(); /* Empty the gallery div to make sure old content is purged and not displayed */
	$("#searchWrapper").empty(); /* Empty the searchWrapper div to make sure old content is purged and not displayed */
	$.ajax({
		type: "GET",
		url: "http://api.jamendo.com/get2/id+name+image+artist_name+artist_id/album/xml/?n=50&order=ratingweek_desc&imagesize=200",
		dataType: "xml",
		success: function(rss) {
			$(rss).find('album').each(function(){
				var id = $(this).find('id').text();
				var title = $(this).find('name').text();
				var imageURL = $(this).find('image').text();
				var artistName = $(this).find('artist_name').text();
				var artistID = $(this).find('artist_id').text();
				$("<li class='items' id='item_"+id+"'></li>").html("<img id='poster_"+id+"' class='poster link' title='"+id+"' onerror='onImgError(this)' src='"+imageURL+"'/>").appendTo('#gallery');
				$("<div class='galleryTitle' id='title_"+id+"'><span id='album_"+id+"' class='link'>"+title+"</span></div>").appendTo("#item_"+id);
				$("<div class='galleryArtist' id='artist_"+id+"'><span id='artist_"+artistID+"' class='link'>"+artistName+"</span></div>").appendTo("#item_"+id);
				$("#poster_"+id).click(function() {
					getAlbumInfo(id);
				});
				$("#album_"+id).click(function() {
					getAlbumInfo(id);
				});
				$("#artist_"+artistID).click(function() {
					bc_links[2] = "getArtistInfo('"+artistID+"')"; 
					bc_names[2] = artistName;
					getArtistInfo(artistID);                   
				});
                
			});
            $(window).scrollTop(state.main.scroll);
		}
	});
};

// Gets the information for the selected album and provides a download link
function getAlbumInfo(id) {
    bt.stash.set("context", "album");
    state.album.id = id;
    bt.stash.set("state", JSON.stringify(state));
	$("#gallery").empty();
	$("#albums").empty();
	$("#searchWrapper").empty();
	$("<div id='heading'></div>").appendTo('#albums');
	$.ajax({
		type: "GET",
		url: "http://api.jamendo.com/get2/image+name+artist_name+artist_id+url/album/xml/?album_id="+id+"&imagesize=200",
		dataType: "xml",
		success: function(xml) {
			$(xml).find('album').each(function(){
				var imageURL = $(this).find('image').text();
				var title = $(this).find('name').text();
				var artist = $(this).find('artist_name').text();
				var artistID = $(this).find('artist_id').text();
                var albumURL = $(this).find('url').text();
				var secretNumber = specialDownload(id);                
				var mp3URL = "http://imgjam.com/torrents/album/"+secretNumber+"/"+id+"/"+id+"-mp32.torrent"
				var oggURL = "http://imgjam.com/torrents/album/"+secretNumber+"/"+id+"/"+id+"-ogg3.torrent"
				/* The following couple of lines is for the breadcrumbs on the top */
				bc_links[2] = "getArtistInfo('"+artistID+"')";
				bc_names[2] = artist;
				bc_links[3] = "getAlbumTracks('"+id+"')";
				bc_names[3] = title;
				displayBreadcrumbs();
				$("<img id='albumArt' title='"+id+"' onerror='onImgError(this)' src='"+imageURL+"'/>").appendTo("#heading");
				$("<div id='albumInfo'></div>").appendTo("#heading");
				$("<div id='title' class='albumTitle'>"+title+"</div>").appendTo("#albumInfo");
				$("<div id='artist' class='albumArtist link'>"+artist+"</div>").appendTo("#albumInfo");
                $("<div><a href='"+albumURL+"'>License & Information</a></div>").appendTo("#albumInfo");
				$("<div id='downloadAlbum' class='download'>Download:</div>").appendTo("#albumInfo");
				$("<div id='mp3Torrent' class='downloadType link'>mp3</div>").appendTo("#downloadAlbum");
				$("<div id='oggTorrent' class='downloadType link'>ogg</div>").appendTo("#downloadAlbum");
				$("#artist").click(function() {
					bc_names.length=3;
					bc_links.length=3;
					getArtistInfo(artistID);
				});
				$("#mp3Torrent").click(function() {
					btapp.add.torrent(mp3URL);
				});
				$("#oggTorrent").click(function() {
						btapp.add.torrent(oggURL);
				});
			});		
		}
	});
	$("<div id='albumTracks'></div>").appendTo('#albums');
    $("<h3>Album Tracks: </h3>").appendTo('#albumTracks');
	getAlbumTracks(id);
}

// Get the tracks for the current album.
function getAlbumTracks(id) {
	$.ajax({
		type: "GET",
		url: "http://api.jamendo.com/get2/id+name+duration/track/xml/track_album+album_artist/?album_id="+id,
		dataType: "xml",
		success: function(xml2) {
			$(xml2).find('track').each(function(){
				var trackID = $(this).find('id').text();
				var title = $(this).find('name').text();
				var duration = $(this).find('duration').text();
				var durationMinutes = Math.floor(duration/60);
				var durationSeconds = duration % 60;
				durationSeconds = zeroPad(durationSeconds,2);
				var prettyDuration = durationMinutes+":"+durationSeconds;
				$("<div class='tracks' id='track_"+trackID+"'></div>").appendTo('#albumTracks');
				$("<div class='track' id='title_"+trackID+"'></div>").appendTo("#track_"+trackID);
				$("#title_"+trackID).append("<a>"+title+"</a>");
				$("#track_"+trackID).append("<div id='duration_"+trackID+"' class='time right'><a>"+prettyDuration+"</a></div>");
			});
		}
	});
}

// Gets all the albums for the artist selected
function getArtistInfo(id) {
    bt.stash.set("context", "artist");
    state.artist.id = id;
	$("#gallery").empty();
	$("#albums").empty();
	$("#searchWrapper").empty();
	displayBreadcrumbs();
	var albumsMP3 = new Array();
	var albumsOGG = new Array();
	var k=0;
	$("<div id='artistHeading'></div>").appendTo('#gallery');
	$("<div id='albumInfo'></div>").appendTo("#artistHeading");    
	$("<ul id='albumList'></ul>").appendTo('#gallery');
    $("<h3>All Albums</h3>").appendTo("#albumList");
	$.ajax({
		type: "GET",
		url: "http://api.jamendo.com/get2/id+name+album_name+album_id+artist_id+image+url/artist/xml/track_album+album_artist/?artist_id="+id+"&imagesize=200",
		dataType: "xml",
		success: function(xml3) {
			$(xml3).find('artist').each(function(){
				var artistImage = $(this).find('image').text();
                var artistURL = $(this).find('url').text();
				var element = document.getElementById("artistInfo");
                state.artist.name = $(this).find('name').text();
                bt.stash.set("state", JSON.stringify(state));
				if (!element) {
					$("<img id='artistImage' onerror='onImgError(this)' src='"+artistImage+"'/>"+artistImage).appendTo("#artistHeading");
					$("<div id='artistInfo' class='artistTitle'>"+bc_names[2]+
                    "<div><a href='" + artistURL + "'>More information</a></div>" +
                    "</div>").appendTo("#artistHeading");
					/*
					
					// I tried to have it so that someone could click one link to add all the albums for the artist.
					// It didn't work. It is below.
					
					$("<div id='downloadAlbum' class='download'>Download Discography:</div>").appendTo("#artistHeading");
					$("<div id='mp3Torrent' class='downloadType link'>mp3</div>").appendTo("#downloadAlbum");
					$("<div id='oggTorrent' class='downloadType link'>ogg</div>").appendTo("#downloadAlbum");
					$("#mp3Torrent").click(function() {
						for (var i=0; i<albumsMP3.length; i++){
							btapp.add.torrent(albumsMP3[i]);
						}
					});
					$("#oggTorrent").click(function() {
						for (var i=0; i<albumsOGG.length; i++){
							btapp.add.torrent(albumsOGG[i]);
						}
					}); */
				}
				return false;
			});	
			$(xml3).find('artist').each(function(){
				var title = $(this).find('album_name').text();
				var albumID = $(this).find('album_id').text();
				var artistName = $(this).find('artist_name').text();
				var imageURL = "http://api.jamendo.com/get2/image/album/redirect/?id="+albumID+"&imagesize=200";
				var element = document.getElementById("item_"+albumID);
				if (!element) {
					var secretNumber = specialDownload(albumID);
					var mp3URL = "http://imgjam.com/torrents/album/"+secretNumber+"/"+id+"/"+id+"-mp32.torrent"
					var oggURL = "http://imgjam.com/torrents/album/"+secretNumber+"/"+id+"/"+id+"-ogg3.torrent"
					albumsMP3[k] = mp3URL;
					albumsOGG[k] = oggURL;
					k++;
					$("<li class='items' id='item_"+albumID+"'></li>").html("<img id='poster_"+albumID+"' class='poster link' title='"+albumID+"' onerror='onImgError(this)' src='"+imageURL+"'/>").appendTo('#albumList');
					$("<div class='galleryTitle link' id='title_"+albumID+"'><span id='album_"+albumID+"'>"+title+"</span></div>").appendTo("#item_"+albumID);
					$(".error").remove();
					$("#poster_"+albumID).click(function() {
						getAlbumInfo(albumID);
					});
					$("#album_"+albumID).click(function() {
						getAlbumInfo(albumID);
					});
				}
			});
		}
	});
}

// Provides a search function to search for albums and artists
function searchShow(query) {
    bt.stash.set("context", "search");
    state.search.query = query;
    bt.stash.set("state", JSON.stringify(state));
	$("#gallery").empty();
	$("#albums").empty();
	$("#searchWrapper").empty();
	$("<ul id='artistGallery'></ul>").appendTo('#searchWrapper');
	$("<div id='searchHeading'>Artists<div>").appendTo('#artistGallery');
	$("<ul id='albumGallery'></ul>").appendTo('#searchWrapper');
	$("<div id='searchHeading'>Albums<div>").appendTo('#albumGallery');
	bc_links[1] = "searchShow('"+query+"')";
	bc_names[1] = "Search - "+query;
	bc_names.length=2;
	bc_links.length=2;
	displayBreadcrumbs();
	$.ajax({
		type: "GET",
		url: "http://api.jamendo.com/get2/id+name+image+artist_name+artist_id/artist/xml/?searchquery="+query+"&order=searchweight_desc&n=6&imagesize=200",
		dataType: "xml",
		success: function(xml4) {
			$(xml4).find('artist').each(function(){
				var id = $(this).find('id').text();
				var imageURL = $(this).find('image').text();
				var artistName = $(this).find('artist_name').text();
				var artistID = $(this).find('artist_id').text();
				$("<li class='items' id='item_"+id+"'></li>").html("<img id='poster_"+id+"' class='poster link' title='"+id+"' onerror='onImgError(this)' src='"+imageURL+"'/>").appendTo('#artistGallery');
				$("<div class='galleryArtist link' id='artist_"+id+"'><span id='artist_"+artistID+"'>"+artistName+"</span></div>").appendTo("#item_"+id);
				$(".error").remove();
				$("#poster_"+id).click(function() {
					bc_links[2] = "getArtistInfo('"+artistID+"')";
					bc_names[2] = artistName;
					getArtistInfo(artistID);
				});
				$("#artist_"+artistID).click(function() {
					bc_links[2] = "getArtistInfo('"+artistID+"')";
					bc_names[2] = artistName;
					getArtistInfo(artistID);
				});
			});
		}
	});
	$.ajax({
		type: "GET",
		url: "http://api.jamendo.com/get2/id+name+image+artist_name+artist_id/album/xml/?searchquery="+query+"&order=searchweight_desc&n=6&imagesize=200",
		dataType: "xml",
		success: function(xml5) {
			$(xml5).find('album').each(function(){
				var id = $(this).find('id').text();
				var title = $(this).find('name').text();
				var imageURL = $(this).find('image').text();
				var artistName = $(this).find('artist_name').text();
				var artistID = $(this).find('artist_id').text();
				$("<li class='items' id='item_"+id+"'></li>").html("<img id='poster_"+id+"' class='poster link' title='"+id+"' onerror='onImgError(this)' src='"+imageURL+"'/>").appendTo('#albumGallery');
				$("<div class='galleryTitle link' id='title_"+id+"'><span id='album_"+id+"'>"+title+"</span></div>").appendTo("#item_"+id);
				$("<div class='galleryArtist link' id='artist_"+id+"'><span id='artist_"+artistID+"'>"+artistName+"</span></div>").appendTo("#item_"+id);
				$(".error").remove();
				$("#poster_"+id).click(function() {
					getAlbumInfo(id);
				});
				$("#album_"+id).click(function() {
					getAlbumInfo(id);
				});
				$("#artist_"+artistID).click(function() {
					bc_links[2] = "getArtistInfo('"+artistID+"')";
					bc_names[2] = artistName;
					getArtistInfo(artistID);
				});
			});
		}
	});
}


/* Renders the breadcrumbs based on the values in the bc_names and bc_links array
 */function displayBreadcrumbs() {
	$("#breadcrumb").empty();
	$("#breadcrumb").append("<div id='bcelement'><a id='bc_0' title='Home' class='link'><img src='logo.gif' alt='Zulu' class='home'/> ZULU Music</a></div>");
	$("#bc_0").click(function() {
		bc_names.length=1;
		bc_links.length=1;
		getRecentAlbums();
	});
	for (var i=1; i<bc_names.length; i++){
		if (typeof(bc_names[i]) != "undefined") {
			$("#breadcrumb").append("<div id='bcelement'><a id='bc_"+i+"' title='"+bc_names[i]+"' class='link'>"+bc_names[i]+"</a></div>");
		}
 	}
	if (bc_names.length > 2) {
		$("#bc_1").click(function() {
			var link1 = bc_links[1];
 			bc_names.length=2;
			bc_links.length=2; 
			eval(link1);
		});
 	}
 	if (bc_names.length > 3) {
		$("#bc_2").click(function() {
			var link2 = bc_links[2];
 			bc_names.length=3;
			bc_links.length=3;
			eval(link2);
		});
  	} 
	if (bc_names.length > 4) {
		$("#bc_3").click(function() {
			var link3 = bc_links[3];
 			bc_names.length=4;
			bc_links.length=4;
			eval(link3);
		});
	}
	if (bc_names.length > 5) { 
		$("#bc_4").click(function() {
			var link4 = bc_links[4];
 			bc_names.length=5;
			bc_links.length=5;
			eval(link4);
		});
	}
	$("<div id='search' class='right'></div>").appendTo('#breadcrumb');
	$("<form id='searchForm' name='srcForm'></form>").appendTo('#search');
	$("#searchForm").append("<input type='text' name='search' value='Search' id='searchInput'/>");
	$("#searchInput").focus(function() {
		if (this.value=='Search') {
			this.value = '';
		}
	}).blur(function() {
		if( !this.value.length ) {
			this.value = 'Search';
		}
	});
	$("#searchForm").submit(function() {
		var series = document.srcForm.search.value
		searchShow(series);
		return false;
	});
}
// Renders the footer to allow people to download Zulu for TV Shows.
// You can get rid of this but please allow some way to promote Zulu and allow a download link
// Thanks
function renderFooter () {
	$("#footer").append("<div id='ZULUtv' class='center link'>Want to download your favorite TV Shows? Try Zulu TV</div>");
    $("#ZULUtv").click(function(){location.href="http://stevenviola.com/zulu/Zulu.btapp";})
}

// Helper functions for paesing the links
function getID(link){
	var pos = link.search('http://www.jamendo.com/album/');
	var id = link.substring(pos+29);
	return id;
}

// Zeropadding function for displaying the time in an easy to read format
function zeroPad(num,count){
	var numZeropad = num + '';
	while(numZeropad.length < count) {
		numZeropad = "0" + numZeropad;
	}
	return numZeropad;
}

// The download format is a little weird, this is how I get around it
function specialDownload(id) {
	var number = id + "";
	var special = number.substring(number.length-3);
	special = parseInt(special);
	return special;
}

// If any image can't be downloaded, it displays a standard image
function onImgError(source) {
  source.src = "noImage.jpg";
  // disable onerror to prevent endless loop
  source.onerror = "";
  return true;
}
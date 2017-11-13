<?php
header('Content-: application/json; charset=utf-8');
include 'config.php';
session_start();

function fetchPhotosFromUserAlbum($user_id, $album_id, $access_token) {
    $ch = curl_init();
    if ($access_token) {
        $url = "https://picasaweb.google.com" . 
            "/data/feed/api/user/" . $user_id . 
            "/albumid/" . $album_id .
            "?alt=json&prettyprint=true&thumbsize=50c,160c,320c&imgmax=1024&" . 
            "access_token=" . $access_token . 
            "&key=" . $key; 
    } else {
        $url = "https://picasaweb.google.com" . 
            "/data/feed/api/user/" . $user_id . 
            "/albumid/" . $album_id .
            "?alt=json&prettyprint=true&thumbsize=50c,160c,320c&imgmax=1024&".
            "key=" . $key; 
    };
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    $json_result = json_decode($result);
    $feed = $json_result->{'feed'};
    $entries = $feed->{'entry'};
    if (count($entries) == 0) return(array());
    $access = $feed->{'gphoto$access'}->{'$t'};
    foreach ($entries as $entry) {
        $when = $entry->{'exif$tags'}->{'exif$time'}->{'$t'};
        if (!$when) {
            $when = $entry->{'gphoto$timestamp'}->{'$t'};     
        }
        // only dated and geolocated pics 
        if ($when) {
            $id = $entry->{'gphoto$id'}->{'$t'};
            $where = $entry->{'georss$where'}->{'gml$Point'}->{'gml$pos'}->{'$t'};
            $tmp = explode(" ", $where);
            $lat = $tmp[0];
            $lng = $tmp[1];
            $neBound = $entry->{'georss$where'}->{'gml$Envelope'}->{'gml$upperCorner'}->{'$t'};
            $swBound = $entry->{'georss$where'}->{'gml$Envelope'}->{'gml$lowerCorner'}->{'$t'};
            $tmp = explode(" ", $neBound);
            if ($tmp[0] == "") $tmp[0] = null;
            $neBoundLat = $tmp[0];
            $neBoundLng = $tmp[1];
            $tmp = explode(" ", $swBound);
            if ($tmp[0] == "") $tmp[0] = null;
            $swBoundLat = $tmp[0];
            $swBoundLng = $tmp[1];
            $title = $entry->{'title'}->{'$t'};
            $description = $entry->{'summary'}->{'$t'};
            $access = $entry->{'gphoto$access'}->{'$t'};
            $point = array ('lat'=>$lat, 'lng'=>$lng);
            $options = array ( 
                'eventIconImage'=> $entry->{'media$group'}->{'media$thumbnail'}[0]->{'url'},
                'thumbnail'=> $entry->{'media$group'}->{'media$thumbnail'}[0]->{'url'},
                'icon'=> $entry->{'media$group'}->{'media$thumbnail'}[0]->{'url'},
                'smallImage'=> $entry->{'media$group'}->{'media$thumbnail'}[1]->{'url'},
                'mediumImage'=> $entry->{'media$group'}->{'media$thumbnail'}[2]->{'url'},
                'largeImage'=> $entry->{'media$group'}->{'media$content'}[0]->{'url'}, 
                'maxImgWidth'=> $entry->{'media$group'}->{'media$content'}[0]->{'width'}, 
                'maxImgHeight'=> $entry->{'media$group'}->{'media$content'}[0]->{'height'}, 
                'bounds'=> array('ne'=>array('lat'=>$neBoundLat, 'lng'=>$neBoundLng), 
                        'sw'=>array('lat'=>$swBoundLat, 'lng'=>$swBoundLng))
            );

            $photos[] = array (
                 'id' => $id,
                 'userId' => $user_id,
                 'title' => $title,
                 'description' => $description,
                 'start' => $when,
                 'access' => $access,
                 'options' => $options
            );

            if ($where) {
//                end($photos)['point'] = $point; 
                  $photos[sizeof($photos)-1]['point'] = $point;
            }
            //}
        }
    }    
    $album = array (
        'title' => $feed->{'title'},
        'photos' => $photos
    );
    return $album;
};

function fetchAlbumsFromUser($user_id, $access_token) {
    $url = 'https://picasaweb.google.com' . 
        '/data/feed/api/user/' . $user_id . 
        '?alt=json&thumbsize=160c&access_token=' . 
        $access_token;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL, $url);
    $result = curl_exec($ch);
    $json_result = json_decode($result);
    $authorUri = $feed->{'author'}[0]->{'uri'};
    $authorId = str_replace("https://picasaweb.google.com/", "", $authorUri);
    $authorName = $feed->{'author'}[0]->{'name'};
    $feed = $json_result->{'feed'};
    $entries = $feed->{'entry'};
    foreach ($entries as $entry) {
        $id = $entry->{'gphoto$id'}->{'$t'};
        $title = $entry->{'title'}->{'$t'};
        $thumbnail = $entry->{'media$group'}->{'media$thumbnail'}[0]->{'url'};
        $numphotos = $entry->{'gphoto$numphotos'}->{'$t'}; 
        $albums[] = array (
            'id' => $id,
            'title' => $title,
            'authorId' => $authorId,
            'authorName' => $authorName,
            'thumbnail' => $thumbnail,
            'numPhotos' => $numphotos
        );
    }    
    return $albums;
};

function updateAlbum($property, $value, $albumId, $user_id, $access_token) {
    $url = 'https://picasaweb.google.com' . 
        '/data/entry/api/user/' . $user_id . '/albumid/' . $albumId .
        '?alt=json&access_token=' . 
        $access_token;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
    curl_setopt($ch, CURLOPT_HTTPHEADER,             
        array('Content-Type: application/xml', 'GData-Version: 2', 'If-Match: *'));

    $content = '<entry xmlns=\'http://www.w3.org/2005/Atom\' '.
    'xmlns:gphoto=\'http://schemas.google.com/photos/2007\'>'.
    '<'.$property.'>'.$value.'</'.$property.'>'.
    '</entry>'. "\n";
    curl_setopt($ch, CURLOPT_POSTFIELDS, $content);
    $result = curl_exec($ch);
    $status = array ('status' => curl_getinfo($ch, CURLINFO_HTTP_CODE));
    return $status;
};

function updatePhotoLocation($location, $albumId, $photoId ,$user_id, $access_token) {
    $url = 'https://picasaweb.google.com' . 
        '/data/entry/api/user/' . $user_id . '/albumid/' . $albumId . '/photoid/' . $photoId .
        '?access_token=' . $access_token;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
    curl_setopt($ch, CURLOPT_HTTPHEADER,             
        array('Content-Type: application/xml', 'GData-Version: 2', 'If-Match: *'));
    $content = '<entry xmlns=\'http://www.w3.org/2005/Atom\' xmlns:exif=\'http://schemas.google.com/photos/exif/2007\' xmlns:app=\'http://www.w3.org/2007/app\' xmlns:gphoto=\'http://schemas.google.com/photos/2007\' xmlns:media=\'http://search.yahoo.com/mrss/\' xmlns:gd=\'http://schemas.google.com/g/2005\' xmlns:gml=\'http://www.opengis.net/gml\' xmlns:georss=\'http://www.georss.org/georss\' gd:etag=\'WCp7ImA9\'>' .
    '<georss:where><gml:Point><gml:pos>'.
    urldecode($location) . '</gml:pos></gml:Point></georss:where>'.'</entry>'. "\n";
 
    curl_setopt($ch, CURLOPT_POSTFIELDS, $content);
    $result = curl_exec($ch);
    $status = array ('status' => curl_getinfo($ch, CURLINFO_HTTP_CODE));
    return $result;
};

function indent($json) {

    $result      = '';
    $pos         = 0;
    $strLen      = strlen($json);
    $indentStr   = '  ';
    $newLine     = "\n";
    $prevChar    = '';
    $outOfQuotes = true;

    for ($i=0; $i<=$strLen; $i++) {

        // Grab the next character in the string.
        $char = substr($json, $i, 1);

        // Are we inside a quoted string?
        if ($char == '"' && $prevChar != '\\') {
            $outOfQuotes = !$outOfQuotes;
        
        // If this character is the end of an element, 
        // output a new line and indent the next line.
        } else if(($char == '}' || $char == ']') && $outOfQuotes) {
            $result .= $newLine;
            $pos --;
            for ($j=0; $j<$pos; $j++) {
                $result .= $indentStr;
            }
        }
        
        // Add the character to the result string.
        $result .= $char;

        // If the last character was the beginning of an element, 
        // output a new line and indent the next line.
        if (($char == ',' || $char == '{' || $char == '[') && $outOfQuotes) {
            $result .= $newLine;
            if ($char == '{' || $char == '[') {
                $pos ++;
            }
            
            for ($j = 0; $j < $pos; $j++) {
                $result .= $indentStr;
            }
        }
        
        $prevChar = $char;
    }

    return $result;
}

$user_id = $_SESSION["user_id"];
if($_GET["user_id"]) {
    $user_id = $_GET["user_id"];
}
$access_token = $_SESSION["access_token"];
$album_id = $_GET["album_id"];
$photo_id = $_GET["photo_id"];
$location = $_GET["location"];


if ($photo_id) {
    if ($location) {
        $jsonData = updatePhotoLocation($location, $album_id, $photo_id, $user_id, $access_token);
    }
} else if ($album_id) {
    if ($property && $value) {
        $jsonData = updateAlbum($value, $album_id, $user_id, $access_token);
    } else {
        $jsonData = fetchPhotosFromUserAlbum($user_id, $album_id, $access_token);
    } 
} else {
    $jsonData = fetchAlbumsFromUser($user_id, $access_token);
}

$jsonEncoded=json_encode($jsonData);
echo indent($jsonEncoded);
?>

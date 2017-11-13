<?php 
include_once("dbconfig.php");
include_once("functions.php");
include_once("getFBCookie.php");



function addEvent($uid, $title, $start, $end, $timezone, $allDay, $description, $loc, $tz, $zoom,$placemark, $coordinates, $ico, $lcol, $lopac, $lweight, $fillcol, $fillopac){
    if($placemark=="point")$coordinates = $placemark."(".preg_replace("/,/"," ",$coordinates).")";
    $allDay=$allDay=="true"?1:0;
    $ret = array();
    try{
        $db = new DBConnection();
        $db->getConnection();
        $sql = "insert into `events` (`userid`, `title`, `start`, `end`, `timezone`,`allday`, `description`, `location`, `placemark`) values ('"
        .$uid."', '"
        .mysql_real_escape_string($title)."', '"
        .$start."', '"
        .$end."', '"
        .$timezone."', "
        .$allDay.", '"
        .mysql_real_escape_string($description)."', '"
        .mysql_real_escape_string($loc)."', '"
        .mysql_real_escape_string($placemark)."')";
        if(mysql_query($sql)==false){
            $ret['isSuccess'] = false;
            $ret['msg'] = mysql_error();
        }else{
            $ret['id'] = mysql_insert_id();
            $parent_id = $ret['id'];
        if(strcmp($placemark, "point")==0)
            {$sql = "insert into `points` (parent_id, coordinates, icon) values ('".$parent_id."', GeomFromText('".$coordinates."'), '".mysql_real_escape_string($ico)."')";}
        else if(strcmp($placemark, "polyline")==0)
            {$sql = "insert into `polylines` (parent_id, coordinates, lineColor, lineOpacity, lineWeight) values ('".$parent_id."', GeomFromText('".$coordinates."'), '".$lcol."', '".$lopac."', '".$lweight."')";}
        else if(strcmp($placemark, "polygon")==0)
            {$sql = "insert into `polygons` (parent_id, coordinates, lineColor, lineOpacity, lineWeight, fillColor, fillOpacity) values ('".$parent_id."', GeomFromText('".$coordinates."'), '".$lcol."', '".$lopac."', '".$lweight."', '".$fillcol."', '".$fillopac."')'";}
        else {}
        if(mysql_query($sql)==false){
            $ret['isSuccess'] = false;
            $ret['msg'] = mysql_error();
        }else{
            $ret['isSuccess'] = true;
            $ret['msg'] = 'add success';
        }
    }  
    }catch(Exception $e){
        $ret['isSuccess'] = false;
        $ret['msg'] = $e->getMessage();
    }
    return $ret;
}

function updateEvent($uid, $id, $startDelta, $endDelta, $allDay){
    $allDay=$allDay=="true"?1:"0";
    $ret = array();
    try{
        $db = new DBConnection();
        $db->getConnection();
        $sql = "update `events` set"
        . " `start`= start + " . $startDelta . ","
        . " `end`= end + " . $endDelta . ","
        . " `allDay`= " . $allDay
        . " where `id`=" . $id . " and `userid`= '" . $uid . "'" ;
//    echo $sql;
        if(mysql_query($sql)==false){
            $ret['isSuccess'] = false;
            $ret['msg'] = mysql_error();
        }else{
            $ret['isSuccess'] = true;
            $ret['msg'] = 'Success';
        }
	    }catch(Exception $e){
            $ret['isSuccess'] = false;
            $ret['msg'] = $e->getMessage();
        }
    return $ret;
}

function updateEventDetails($uid, $id, $start, $end, $title, $allday, $description, $loc, $tz){
  $ret = array();
  try{
    $db = new DBConnection();
    $db->getConnection();
    $sql = " update `events` set"
      . " `start`='" . php2MySqlTime(js2PhpTime($start)) . "', "
      . " `end`='" . php2MySqlTime(js2PhpTime($end)) . "', "
      . " `title`='" . mysql_real_escape_string($title) . "', "
      . " `allday`='" . mysql_real_escape_string($allday) . "', "
      . " `description`='" . mysql_real_escape_string($description) . "', "
      . " `location`='" . mysql_real_escape_string($loc) . "', "
      . "where `id`=" . $id . " and `userid`= '" . $uid . "'";
    //echo $sql;
		if(mysql_query($sql)==false){
      $ret['isSuccess'] = false;
      $ret['msg'] = mysql_error();
    }else{
      $ret['isSuccess'] = true;
      $ret['msg'] = 'Succefully';
    }
	}catch(Exception $e){
     $ret['isSuccess'] = false;
     $ret['msg'] = $e->getMessage();
  }
  return $ret;
}

function deleteEvent($uid, $id){
  $ret = array();
  try{
    $db = new DBConnection();
    $db->getConnection();
    $sql = "delete from `events` where `id`=" . $id . " 
    and `userid`= '". $uid ."'" ;
		if(mysql_query($sql)==false){
      $ret['isSuccess'] = false;
      $ret['msg'] = mysql_error();
    }else{
      $ret['isSuccess'] = true;
      $ret['msg'] = 'Success';
    }
	}catch(Exception $e){
     $ret['isSuccess'] = false;
     $ret['msg'] = $e->getMessage();
  }
  return $ret;
}

header('Content-type:text/javascript;charset=UTF-8');
$method = $_POST["method"];
$uid = "0";
if($cookie){$uid = $cookie["uid"];}

switch ($method) {
    case "list":
        $ret = listEvent($uid, $_POST["showdate"], $_POST["viewtype"]);
        break;
    case "update":
        $ret = updateEvent(
        $uid, 
        $_POST["id"], 
        $_POST["startDelta"], 
        $_POST["endDelta"],
        $_POST["allDay"]);
        break; 
    case "delete":
        $ret = deleteEvent($uid, $_POST["id"]);
        break;
    case "add": 
        $ret = addEvent(
        $uid, 
        $_POST["title"], 
        $_POST["start"], 
        $_POST["end"],
        $_POST["timezone"],
        $_POST["allDay"],
        $_POST["description"],
        $_POST["location"], 
        $_POST["timezone"], 
        $_POST["zoom"], 
        $_POST["placemark"], 
        $_POST["coordinates"], 
        $_POST["icon"], 
        $_POST["lineColor"], 
        $_POST["lineOpacity"], 
        $_POST["lineWeight"], 
        $_POST["fillColor"],
        $_POST["fillOpacity"]);
        break;
    case "updateDetails": 
        $ret = updateEventDetails(
        $uid, 
        $_POST["id"],
        $_POST["title"], 
        $_POST["start"], 
        $_POST["end"],
        $_POST["timezone"],
        $_POST["allDay"],
        $_POST["description"],
        $_POST["location"], 
        $_POST["timezone"], 
        $_POST["zoom"], 
        $_POST["placemark"], 
        $_POST["coordinates"], 
        $_POST["icon"], 
        $_POST["lineColor"], 
        $_POST["lineOpacity"], 
        $_POST["lineWeight"], 
        $_POST["fillColor"],
        $_POST["fillOpacity"]);
        break;
}

$jsonEncoded=json_encode($ret);
echo "(".$jsonEncoded.")";

?>


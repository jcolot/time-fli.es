<?php
//ini_set('display_errors', 'On');
//error_reporting(E_ALL);
include './config.php';
$code = $_GET["code"] ;
$url = "https://accounts.google.com/o/oauth2/token" ;
//set POST variables
$fields = array(
            'code'=>$code,
            'grant_type'=>'authorization_code',
            'client_id'=>'793897304035.apps.googleusercontent.com',
            'client_secret'=>$client_secret,
            'redirect_uri'=>'http://time-fli.es/php/oauth2callback.php'
);

//url-ify the data for the POST
foreach($fields as $key=>$value) { $fields_string .= $key.'='.$value.'&'; }
rtrim($fields_string,'&');

//open connection
$ch = curl_init();

//set the url, number of POST vars, POST data
curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch,CURLOPT_URL,$url);
curl_setopt($ch,CURLOPT_POST,count($fields));
curl_setopt($ch,CURLOPT_POSTFIELDS,$fields_string);
$result = curl_exec($ch);

$json_result = json_decode($result);
$access_token = $json_result->{'access_token'};
$token_type = $json_result->{"token_type"};
$id_token = $json_result->{"id_token"};
$refresh_token = $json_result->{"refresh_token"};

session_start();

$url = "https://www.googleapis.com/oauth2/v1/userinfo?access_token=".$access_token;   

curl_setopt($ch, CURLOPT_URL,$url);
curl_setopt($ch, CURLOPT_HTTPGET,true);
$result = curl_exec($ch);
curl_close($ch);

$json_result = json_decode($result);
$user_id = $json_result->{"id"};
$name = $json_result->{"name"};
$given_name = $json_result->{"given_name"};
$family_name = $json_result->{"family_name"};
$link = $json_result->{"link"};
$picture = $json_result->{"picture"};
$gender = $json_result->{"gender"};
$locale = $json_result->{"locale"};

$_SESSION["user_id"] = $user_id;
$_SESSION["access_token"] = $access_token;
$_SESSION["token_type"] = $token_type;
$_SESSION["id_token"] = $id_token;
$_SESSION["refresh_token"] = $refresh_token;

$expire = time() + 60 * 60;
setcookie("user_id", $json_result->{"id"}, $expire);
//setcookie("access_token", $json_result->{"access_token"}, $expire);

// MySQL - Save user
//if ($user_id) {
//    mysql_connect("localhost", "root", "hidden") or
//        die("Could not connect: " . mysql_error());
//    mysql_select_db("time-flies");
//    mysql_query("INSERT INTO `users` (`user_id`,`name`,`given_name`,".
//        "`family_name`,`link`,`picture`,`gender`,`locale`,`visits`)".
//        "VALUES ('$user_id','$name','$given_name','$family_name','$link',".
//        "'$picture','$gender','$locale', 1) ON DUPLICATE KEY UPDATE ".
//        "`name`='$name',`given_name`='$given_name',".
//        "`family_name`='$family_name',`link`='$link',".
//        "`picture`='$picture',`gender`='$gender',`locale`='$locale',".
//        "`visits`=`visits` + 1"); 
//};

?>
<!DOCTYPE HTML>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title></title>
</head>
<body>
<script>
<?php 
$got_user_id = $user_id ? "true" : "false";
echo "if ($got_user_id){\n";
?>
self.opener.$("#g-plus-icon")[0].src = "<?php  echo $picture; ?>" 
self.opener.$(".header-item .connect").html("+" + "<?php echo $given_name; ?>");
self.opener.$(self.opener.document).trigger("userconnected");
self.opener.tf.users["<?php echo $user_id ;?>"] = {};
self.opener.tf.users["<?php echo $user_id ;?>"].name = '<?php echo $name;?>';
self.opener.tf.users["<?php echo $user_id ;?>"].givenName = '<?php echo $given_name;?>';
self.opener.tf.users["<?php echo $user_id ;?>"].familyName = '<?php echo $family_name;?>';
self.opener.tf.users["<?php echo $user_id ;?>"].picture = '<?php echo $picture;?>';
self.opener.tf.users["<?php echo $user_id ;?>"].gender = '<?php echo $gender;?>';
self.opener.tf.users["<?php echo $user_id ;?>"].locale = '<?php echo $locale;?>';
self.opener.tf.connecting = false;
<?php 
echo "};\n";
?>
window.close();
</script>
</body>
</html>

<?php
include "php/config.php";
header('Content-: application/json; charset=utf-8');

session_start();

$google_id = $_SESSION["google_id"];

//overrides session
if ($_GET["google_id"]) {

    $google_id = $_GET["google_id"];

}

function fetch_profile($google_id) {
    $url = "https://www.googleapis.com/plus/v1/people/" . $google_id . "?key=$key"; 
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    $result = curl_exec($ch);
    curl_close($ch);
};

fetch_profile($google_id);
?>

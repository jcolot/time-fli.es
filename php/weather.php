<?php
include('HTTP/Request.php');


$lat = $_POST['lat'];
$lon = $_POST['lon'];
$tz = $_POST['tz'];

$url = "http://free.worldweatheronline.com/feed/weather.ashx?q=50.00,4.00&format=json&num_of_days=5&key=988b912e3e160458110205";

$r= new HTTP_Request($url);
$r->setMethod(HTTP_REQUEST_METHOD_GET);
$r->sendRequest () ;
$response = $r->getResponseBody() ; 
$json_forecast = json_decode($response);
print( $json_forecast->{'data'}->{'current_condition'}[0]->{'cloudcover'} );

for($i = 0 ; $i < 5 ; $i++){
echo $date[$i]= $json_forecast->{'data'}->{'weather'}[$i]->{'date'} ;
echo $epoch[$i]["midnight"] =  floor(strtotime($date[$i])/86400)*86400+1;
echo " ";
$sun_info[$i] = date_sun_info($epoch[$i]["midnight"], 50.7667, 4.2333);
foreach ($sun_info[$i] as $key => $val) {
    $epoch[$i][$key]= $val;
    echo "$key: " . date("c", $val) . "\n";
}
}
?>
 

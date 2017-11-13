<?php 
// The file you are rotating
$images = explode("|", $_GET["images"]);
//How many degrees you wish to rotate
$angle = 0;
// This sets the image type to .jpg but can be changed to png or gif
header('Content-type: image/png') ;
//header('Content-type: text/plain') ;

foreach ($images as $image) {
// Create the canvas
$srcImage = imagecreatefromjpeg($image) ;
$srcWidth = imagesx ($srcImage);
$srcHeight = imagesy ($srcImage);
$dstWidth = floor($srcWidth * sqrt(2));
$dstHeight = floor($srcHeight * sqrt(2));

//// Rotates the image
$angle = $angle + $_GET["rotate"];
$dstImage = imagecreatetruecolor ($dstWidth, $dstHeight);
$transparent = imagecolorallocatealpha($dstImage, 255, 255, 255, 127);
$rotatedImage = imagerotate($srcImage, ((360-$angle)%360), $transparent);
$rotatedWidth = imagesx($rotatedImage);
$rotatedHeight = imagesy($rotatedImage);
$deltaX = floor(($dstWidth - $rotatedWidth)/2);
$deltaY = floor(($dstHeight - $rotatedHeight)/2);
imagealphablending($dstImage, true); 
imagecolorallocatealpha($dstImage , 255, 255, 255, 127);
imagefill( $dstImage, 0, 0, $transparent ); 
imagecopy($dstImage, $rotatedImage, $deltaX, $deltaY, 0, 0, $rotatedWidth, $rotatedHeight);
}

imagealphablending($dstImage, false);
imagesavealpha($dstImage, true);
imagepng($dstImage);
?> 

#!/bin/bash
# My first script

declare -i nos
nos=0
for folder in /Users/Mike/ga/working/tate/collection/artworks/*/ ; do 
  echo "$folder is a directory"; 
  cd $folder;
  for subfolder in */ ; do
    echo "$subfolder is sub directory"
    cd $subfolder
    for file in *.*; do 
      echo $file
      nos=nos+1;    
      mongoimport --db multiple_choice --collection artworks --file $file --jsonArray
  done;
  cd ..
  done;
  cd ..
done
  echo $nos;
# mongoimport --db multiple_choice --collection artists --file ayrton-michael-681.json  --jsonArray
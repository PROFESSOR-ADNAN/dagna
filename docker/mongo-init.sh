#!/usr/bin/env bash
set -e

mongosh --eval '
try {
  rs.status();
  print("Replica set rs0 already initiated.");
} catch (e) {
  print("Initiating replica set rs0...");
  rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "127.0.0.1:27017" }
    ]
  });
  print("Replica set rs0 initiated successfully.");
}
'

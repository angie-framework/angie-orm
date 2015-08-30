# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

#### [0.0.4] - 2015-08-30
##### Fixed
- Fixed issues with the npm postinstall script.

#### [0.0.3] - 2015-08-23
##### Changed/Removed/Added
- Changed requirement structure:
    - Removed references to `BaseConnection` where they should not have existed.
    - Separated the database and model dependencies into different directories.
- Removed documentation from `.gitignore`
- Removed unnecessary `use strict;` lines from many files.
- Created a `dist` folder/runtime with an equivalent pre-compiled Angie Log framework.

#### [0.0.2] - 2015-08-07
##### Added
- Added an init script to run exclusively of the Angie project
- Added a method to instantiate packages standalone
- Added m2m connections for MySQL/Sqlite3

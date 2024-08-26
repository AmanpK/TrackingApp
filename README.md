In this project, there are 3 screens with name LoginScreen, AttendanceScreen and HomeScreen(tracking).

On LoginScreen, dummy api is used to login using id = emilys and password = emilyspass, and then store token to asyncstorage.

On AttendanceScreen, Added clock in button to make attendance and store time to asyncstorage.

On HomeScreen, Added map with current location which indicates with red marker and predefiend dealer location to show tracking, indicates with blue marker.
When user start moving towards dealer location, blue marker with turn to green in color within 50m of radius to dealer location.

User can clock out using clock out button and also logout from the app using logout button.

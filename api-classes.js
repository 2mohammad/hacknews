const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/**
 * This class maintains the list of individual Story instances
 *  It also has some methods for fetching, adding, and removing stories
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /**
   * This method is designed to be called to generate a new StoryList.
   *  It:
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.*
   */

  // TODO: Note the presence of `static` keyword: this indicates that getStories
  // is **not** an instance method. Rather, it is a method that is called on the
  // class directly. Why doesn't it make sense for getStories to be an instance method?

  static async getStories() {
    // query the /stories endpoint (no auth required)
    const response = await axios.get(`${BASE_URL}/stories`);

    // turn the plain old story objects from the API into instances of the Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    const storyList = new StoryList(stories);
    return storyList;
  }

  /**
   * Method to make a POST request to /stories and add the new story to the list
   * - user - the current instance of User who will post the story
   * - newStory - a new story object for the API with title, author, and url
   *
   * Returns the new story object
   */


  /**
   * Remove Story - API call to add story
   */
  async addStory(story, user) {
    // TODO - Implement this functions!
    // this function should return the newly created story so it can be used in
    // the script.js file where it will be appended to the DOM
    //console.log(newStory.author);
    console.log(story);
    const response = await axios.post (`${BASE_URL}/stories`,{
      "token": user.loginToken,
      "story": {
        "author": story.author,
        "title": story.title,
        "url": story.url
      }
    })
    console.log(response);
    return response;
  }


  /**
   * Remove Story - API call to delete story
   */
  async removeStory(story){
    const tokens = localStorage.getItem("token")
      const response = await axios({
        url: `${BASE_URL}/stories/${story}`,
        method: 'DELETE',
        data: {
          token: tokens
        }
      });
      const myStories = JSON.parse(localStorage.getItem("stories"));
      const favorites = JSON.parse(localStorage.getItem("favorites"));
      const result = myStories.filter(element => element.storyId !== response.data.story.storyId)
      const favs = favorites.filter(element => element.storyId !== response.data.story.storyId)
      localStorage.setItem("favorites", JSON.stringify(favs));
      localStorage.setItem("stories", JSON.stringify(result));
      return result;
  } 
}


/**
 * The User class to primarily represent the current user.
 *  There are helper methods to signup (create), login, and getLoggedInUser
 */

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  /* Create and return a new user.
   *
   * Makes POST request to API and returns newly-created user.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });

    // build a new User instance from the API response
    const newUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    newUser.loginToken = response.data.token;

    return newUser;
  }

  /* Login in user and return user instance.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });

    // build a new User instance from the API response
    const existingUser = new User(response.data.user);

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = response.data.token;
    localStorage.setItem("favorites", JSON.stringify(response.data.user.favorites));
    localStorage.setItem("stories", JSON.stringify(response.data.user.stories));
    console.log(response.data.user.stories);
    return existingUser;
  }

  /** Get user instance for the logged-in-user.
   *
   * This function uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that info.
   */

  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;

    // call the API
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    localStorage.setItem("favorites", JSON.stringify(response.data.user.favorites))
    localStorage.setItem("stories", JSON.stringify(response.data.user.stories));

    return existingUser;
  }


  /**
   * Toggle favorites - API calls to toggle favorites
   */
  async toggleFavorites(target, token){
    if(target.classList.contains("fas")){
      const response = await axios.post(`${BASE_URL}/users/${this.username}/favorites/${target.id}`, {
        "token": token
      });
      localStorage.setItem("favorites", JSON.stringify(response.data.user.favorites))
    }
    if(target.classList.contains("far")){
      const response = await axios({
        url: `${BASE_URL}/users/${this.username}/favorites/${target.id}`,
        method: 'DELETE',
        data: {
          token: token
        }
      });
      localStorage.setItem("favorites", JSON.stringify(response.data.user.favorites))
    }
  }
}

/**
 * Class to represent a single story.
 */

class Story {

  /**
   * The constructor is designed to take an object for better readability / flexibility
   * - storyObj: an object that has story properties in it
   */

  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}
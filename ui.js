$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $submitStory = $("#submit-story");
  const $favStory = $("#fav-story");
  const $favoritedArticles = $("#favorited-articles");
  const $myStory = $("#my-story");
  const $myArticles = $("#my-articles");
  const $navAll = $("#nav-all");
  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });


  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */
  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });


  /**
  * Event listener for submit form.
  */
  $submitForm.on("submit", async (evt)=>{
    evt.preventDefault();
    const aStory = {
    author: $("#author").val(),
    title: $("#title").val(),
    url: $("#url").val()
    }
    const user = {
      loginToken: localStorage.getItem("token")
    }
    const submitStory = new StoryList();
    await submitStory.addStory(aStory, user)
    await generateStories();
    await checkIfLoggedIn();
    $submitForm.hide()
  });


  /**
  * Event listener for favorites tab.
  */
  $favStory.on("click", async (evt) => {
    evt.preventDefault();
    $favoritedArticles.empty()
    $allStoriesList.hide();
    $myArticles.hide()
    $favoritedArticles.show()
    const favorites = JSON.parse(localStorage.getItem("favorites"));
    for(let element of favorites){
      const fav = generateStoryHTML(element);
      $favoritedArticles.append(fav);
    }
    installFavorites()
    buildFavorites()
  });


  /**
  * Event listener for my stories tab.
  */
  $myStory.on("click", (evt) => {
    evt.preventDefault();
    $myArticles.empty()
    $allStoriesList.hide();
    $favoritedArticles.hide();
    $myArticles.show()
    const myStories = JSON.parse(localStorage.getItem("stories"));
    make(myStories);
    buildFavorites()
  });


  /**
  * function to generate html markup for the my stories page and add listner
  * for story removal.
  */
  function make(myStories){
    $myArticles.empty()
    for(let element of myStories){
      const story = generateMyStoryHTML(element);
      $myArticles.append(story);
    }
    removeStory()
  }


  /**
  * function to generate html markup for the my stories page.
  */
  function generateMyStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <strong><i id="${story.storyId}" class="fa-star far"></i></strong>
        <strong><i id="${story.storyId}" class="fa-trash-alt far"></i></strong>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    return storyMarkup;
    }


  /**
  * function to add listener to remove stories from my stories page.
  */
  function removeStory(){
    const vals = document.getElementsByClassName("fa-trash-alt");
    const story = new StoryList
    for (let ex of vals){
      ex.addEventListener("click", async (evt)=>{
        evt.preventDefault()
          make(await story.removeStory(ex.id))
      })
    }
  }


  /**
   * Event handler for Navigation to Homepage
   */
  $navAll.on("click", async (evt) => {
    evt.preventDefault();
    await checkIfLoggedIn();
    $allStoriesList.empty();
    $myArticles.hide();
    $favoritedArticles.hide();
    $allStoriesList.show();
    await checkIfLoggedIn();
  });


  /**
   * Favorite Functionality - event listener
   */

  function installFavorites(){
    const obj = {
      username: localStorage.getItem("username"),
    }
    const fav = new User(obj);
    const token = localStorage.getItem("token");
    const element = document.querySelectorAll("i");
    for (let ex of element){
      if (ex.classList.contains("far") || ex.classList.contains("fas")){
        ex.addEventListener('click', (e)=>{
          if(e.target.classList.contains("far")){
            e.target.classList.remove("far");
            e.target.classList.add("fas");
            fav.toggleFavorites(e.target, token);
          }
          else if(e.target.classList.contains("fas")){
            e.target.classList.remove("fas");
            e.target.classList.add("far");
            fav.toggleFavorites(e.target, token);
          }
        })
      }
    }
  }


  /**
   * Favorite Functionality - class toggle
   */
  function buildFavorites(){
    const favorites = JSON.parse(localStorage.getItem("favorites"));
    const list = document.querySelectorAll("i");
    if (favorites !==  null){
      for (let element of favorites){
        for (let ex of list){
          if (element.storyId === ex.id){
            ex.classList.remove("far");
            ex.classList.add("fas");
          }
        }
      }
    }
  }


  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  $submitStory.on("click", ()=>{
    $submitForm.toggle();
  })
  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  // $("body").on("click", "#nav-all", async function() {
  //   hideElements();
  //   await generateStories();
  //   $allStoriesList.show();
  // });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {

    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
 
  }


  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <strong><i id="${story.storyId}" class="fa-star far"></i></strong>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $submitStory.show();
    $favStory.show();
    $myStory.show();
    const element = document.querySelectorAll("i");
      for (let ex of element){
        if (ex.classList.contains("far") || ex.classList.contains("fas")){
          ex.classList.remove("hidden");
        }
      }
    installFavorites();
    buildFavorites();

  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});

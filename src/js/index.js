import Search from './Models/Search';
import Recipe from './Models/Recipe';
import List from './Models/List';
import Likes from './Models/Likes';
import * as searchView from './Views/searchView';
import * as recipeView from './Views/recipeView';
import * as listView from './Views/listView';
import * as likesView from './Views/likesView';
import {elements, renderLoader, clearLoader} from './Views/base';


/* Global state of the app
- Search Object
- Current recipe object
- Shopping list object
- Liked recipes

*/
const state = {};


/**
 * Search controller
 * 
 */
const controlSearch = async () => {
    // 1) get query from view
    const query = searchView.getInput();
  
    

    if(query){
        // 2) New search object and add to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try{
            
            //4) search for recipes
            await state.search.getResults();
    
            //5) render results on UI
            clearLoader();
           searchView.renderResults(state.search.result);
           
        } catch (err) {
            alert ('Something went wrond with search');
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e=> {
    e.preventDefault();
    controlSearch();
});


elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline')
    if(btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
        
    }
})

/**
 * Recipe controller
 */

const controlRecipe = async () => {
    // Get ID from URL
    const id = window.location.hash.replace('#', '')
   
    if (id){
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        // highlight 
        if(state.search) searchView.highlightSelected(id);

        // create new recipe
        state.recipe = new Recipe(id);
      

        try{

            // Get recipe data and parse ingredients        
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //calculate time and servings
            state.recipe.calcTime();
            state.recipe.calcServings();

            // render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
                );


        } catch (err){
            console.log(err)
            alert('Error processing recipe');
        }
    }
}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * List controller
 */


const controlList = () => {
    //create a new list IF there is none yet

    if(!state.list) state.list = new List();

    // add each ingredient to the list and UI

    state.recipe.ingredients.forEach(el => {
        const item =state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

/**
 * Likes controller
 * 
 */


const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //user has not yet liked current recipe
    if (!state.likes.isLiked(currentID)){
        //add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        )
        // toggel button
             likesView.toggleLikeBtn(true);   
        // add like to ui list
            likesView.renderLike(newLike);
          

    //user has liked current recipe
    
    } else {
        //remove like from the state
        state.likes.deleteLike(currentID);
        // toggel button
        likesView.toggleLikeBtn(false);
        // remove like from ui list
        likesView.deleteLike(currentID);
    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

//Restore the likes on page load
window.addEventListener('load', () => {
    state.likes = new Likes ();

    //restore likes
    state.likes.readStorage();

    //toggle button if liked
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //render existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
})

// handle delete and update list items
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    

    //handle delete
    if (e.target.matches('.shopping__delete, .shopping__delete *')){
        //delete from state:
        state.list.deleteItem(id);

        //delete from UI
        listView.deleteItem(id);

        //handle count update
    } else if (e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});


//handling recipe buttonclicks event bubbling/delegation
elements.recipe.addEventListener('click', e=>{
    if (e.target.matches('.btn-descrease, .btn-decrease *')){
        //decrease is clicked
        if (state.recipe.servings > 1){
         state.recipe.updateServings('dec');
         recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')){
        //increase is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        // add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')){
        controlLike();
    }
   

});


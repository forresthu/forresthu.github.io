### Data Preparation
* Rome2Rio
    * Register API
    * Get travel time and money cost
    * Input (lat, lon)
    * Return ()
* Distance Matrix
    * For driving mode, we don't need fetch from Rome2Rio. We can calculate from distance matrix 
    * 
* Oberservations
    * Oppupation [Other|Profession|Sales|]
    * Destination [Work|Home|] 
* Split data into 50% training data, 40% validataion data, and 10% test data 
    * Keep the percentage of each transportation mode
    * 

### Model
* Loss function
  * Cross-entropy 
* Softmax classification

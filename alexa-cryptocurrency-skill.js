const Alexa = require('ask-sdk-core');
var request = require('request');
var AWS = require('aws-sdk');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Welcome to the Cryptocurrency, you can ask for cryptocurrency data!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();

  }
};

const HelloWorldIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
  },
  handle(handlerInput) {
    const speechText = 'Hello World!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  }
};

const CurrentPriceIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
    && handlerInput.requestEnvelope.request.intent.name === 'CurrentPrice';
  },
  async handle(handlerInput) {
    const currencyOne = handlerInput.requestEnvelope.request.intent.slots.Currency.value.toUpperCase();
    var useDatabase = true;
    var response = "";

    const db = await GetInformationFromDatabase(currencyOne);
    if(db !=null){
      var data = JSON.parse(db.rates.S);
      var now = new Date();
      var recordDate = new Date(db.Timestamp.S);

      if((now - recordDate)> (10*60*1000)){
        useDatabase = false;
      }else{
        response = "from the database - the current price for "+currencyOne+" is $";
        var rate = parseFloat(data['price']).toFixed(2);
        response += rate;
      }
    }else{
     useDatabase = false;
    }

    if(useDatabase == false){
      const currencyAPIdata = await GetInformationFromCurrencyAPI(currencyOne);
      await WriteInformationToDatabase(currencyOne,currencyAPIdata,FormatDate(new Date()));
      var data = JSON.parse(currencyAPIdata);
      var rate = parseFloat(data['price']).toFixed(2);
      response = "from the api - the Current price for "+currencyOne+" is $";
      response += rate;
    }
    return handlerInput.responseBuilder
    .speak(response)
    .withSimpleCard(response, response)
    .getResponse();
 }
};


  const TradeVolumeIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
    && handlerInput.requestEnvelope.request.intent.name === 'TradeVolume';
  },
  async handle(handlerInput) {
    const currencyOne = handlerInput.requestEnvelope.request.intent.slots.Currency.value.toUpperCase();
    var useDatabase = true;
    var response = "";

    const db = await GetInformationFromDatabase(currencyOne);
    if(db !=null){
      var data = JSON.parse(db.rates.S);
      var now = new Date();
      var recordDate = new Date(db.Timestamp.S);

      if((now - recordDate)> (10*60*1000)){
        useDatabase = false;
      }else{
        response = "from the database - the trade volume between "+currencyOne+" is $";
        var rate = parseFloat(data['volume']).toFixed(2);
        response += rate;
      }
    }else{
     useDatabase = false;
    }

    if(useDatabase == false){
      const currencyAPIdata = await GetInformationFromCurrencyAPI(currencyOne);
      await WriteInformationToDatabase(currencyOne,currencyAPIdata,FormatDate(new Date()));
      var data = JSON.parse(currencyAPIdata);
      var rate = parseFloat(data['volume']).toFixed(2);
      response = "from the api - the trade volume for "+currencyOne+" is $";
      response += rate;
    }

    return handlerInput.responseBuilder
    .speak(response)
    .withSimpleCard(response, response)
    .getResponse();
 }
};


  const PriceChangeIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
    && handlerInput.requestEnvelope.request.intent.name === 'PriceChange';
  },
  async handle(handlerInput) {
    const currencyOne = handlerInput.requestEnvelope.request.intent.slots.Currency.value.toUpperCase();
    var useDatabase = true;
    var response = "";

    const db = await GetInformationFromDatabase(currencyOne);
    if(db !=null){
      var data = JSON.parse(db.rates.S);
      var now = new Date();
      var recordDate = new Date(db.Timestamp.S);

      if((now - recordDate)> (10*60*1000)){
        useDatabase = false;
      }else{
        response = "from the database - the price change between "+currencyOne+" is $";
        var rate = parseFloat(data['change']).toFixed(2);
        response += rate;
      }
    }else{
     useDatabase = false;
    }

    if(useDatabase == false){
      const currencyAPIdata = await GetInformationFromCurrencyAPI(currencyOne);
      await WriteInformationToDatabase(currencyOne,currencyAPIdata,FormatDate(new Date()));
      var data = JSON.parse(currencyAPIdata);
      var rate = parseFloat(data['change']).toFixed(2);
      response = "from the api - the price change for "+currencyOne+" is $";
      response += rate;
    }


    return handlerInput.responseBuilder
    .speak(response)
    .withSimpleCard(response, response)
    .getResponse();
 },
};

function GetInformationFromDatabase(currencyOne){
  return new Promise(((resolve, reject) =>{

    AWS.config.update({region: 'us-east-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    var params = {
      TableName: 'Cryptocurrency',
      Key: {
        'Currency': {S:currencyOne}
      }
    };

    ddb.getItem(params, function(err, data){
      if(err) {
        reject('error');
      }else{
        resolve(data.Item);
      }
    });
  }));
}

async function WriteInformationToDatabase(currencyOne,rates,timestamp){

  return new Promise(((resolve, reject) => {

    var AWS = require('aws-sdk');

    AWS.config.update({region: 'us-east-1'});

    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    var params = {
      TableName: 'Cryptocurrency',
      Item: {
        'Currency' : {S: currencyOne},
        'rates' : {S: rates},
        'Timestamp' : {S: timestamp}
      }
    };

    ddb.putItem(params, function(err, data){
      if (err) {
        resolve("unable to write data to the database");
      }else{
        resolve('data written to the database successfully');
      }
    });
  }));
}

function GetInformationFromCurrencyAPI(currencyOne){
  return new Promise(((resolve, reject) => {
      var url = 'https://www.cryptonator.com/api/ticker/';
      url += currencyOne+'-usd';
    request.get(url,(error, response, body) =>{
      if(error){
        reject("unable to find requested information");
      }
      const theFact = body;
      var data = JSON.parse(theFact);
      resolve(JSON.stringify(data['ticker']));
    });
  }));
}

function FormatDate(date)
{
  var aaaa = date.getFullYear();
  var gg =date.getDate();
  var mm = (date.getMonth() + 1);

  if(gg < 10)
     gg = '0' +gg;

  if(mm < 10)
     mm = '0' + mm;

  var cur_day = aaaa + "-" + mm + "-" + gg;

  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();

  if(hours < 10)
     hours = "0" + hours;

  if(minutes < 10)
    minutes = "0" + minutes;

  if(seconds < 10)
    seconds = "0" + seconds;

  return cur_day + " " + hours +":"+ minutes + ":" + seconds;

}

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type    === 'IntentRequest'
    && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {

    return handlerInput.responseBuilder
      .speak('Sorry we were unable to find that cryptocurrency.')
      .reprompt('Sorry we were unable to find that cryptocurrency.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    HelloWorldIntentHandler,
    HelpIntentHandler,
    PriceChangeIntentHandler,
    CurrentPriceIntentHandler,
    TradeVolumeIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
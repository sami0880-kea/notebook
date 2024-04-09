import React, { useState, useEffect } from 'react';
import { ScrollView, Image, StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, Alert, Button } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { app, database, storage } from './Firebase'
import { doc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage'; 
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'; 
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

const auth = getAuth(app);
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginPage">
        <Stack.Screen name="Login" component={LoginPage} options={{ headerBackVisible: false}}/>
        <Stack.Screen name="Signup" component={SignupPage} options={{ headerBackVisible: false }}/>
        <Stack.Screen name="Notes" component={NotesPage} options={{ headerBackVisible: false }}/>
        <Stack.Screen name="DetailsPage" component={DetailsPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const LoginPage = ({ navigation, route }) => {
  const [emailInput, setEmailInput] = useState("admin@test.com");
  const [passwordInput, setPasswordInput] = useState("Test123");

  /* useEffect(() => {  
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if(currentUser) {
        setUserId(currentUser.uid)
      } else {
        setUserId(null)
      }
    })
    return () => unsubscribe()  
  }, []) */
  
  async function login() {
    try {
      const userCredentials = await signInWithEmailAndPassword(auth, emailInput, passwordInput)
      if(userCredentials) {
        const userId = userCredentials.user.uid
        navigation.navigate('Notes', { userId });
      }
    } catch(e) {
      Alert.alert("Login failed!")
    }
  }

  function SwitchSignupPage() {
    navigation.navigate('Signup' )
  }

  return (
    <View style={styles.main}>
      <Text style={styles.title}>Notebook App</Text>
      <Text>by Samim S.</Text>

      <TextInput
        style={styles.textInput}
        placeholder='Email'
        onChangeText={text => setEmailInput(text)}
        value={emailInput}
      />
      <TextInput
        style={styles.textInput}
        placeholder='Password'
        onChangeText={text => setPasswordInput(text)}
        value={passwordInput}
      />
      <Button
        title='Login'
        onPress={login}
      />
      <Button
        title='or Signup'
        onPress={SwitchSignupPage}
      />
    </View>
  );
}

const SignupPage = ({ navigation, route }) => {
  const [emailInput, setEmailInput] = useState("admin@test.com");
  const [passwordInput, setPasswordInput] = useState("Test123");

  async function signup() {
    try {
      const userCredentials = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
      if(userCredentials) {
        const userId = userCredentials.user.uid
        navigation.navigate('Notes', { userId });
      }
    } catch(e) {
      Alert.alert("Login failed!")
    }
  }

  function SwitchLoginPage() {
    navigation.navigate('Login')
  }

  return (
    <View style={styles.main}>
      <Text style={styles.title}>Notebook App</Text>
      <Text>by Samim S.</Text>

      <TextInput
        style={styles.textInput}
        placeholder='Email'
        onChangeText={text => setEmailInput(text)}
        value={emailInput}
      />
      <TextInput
        style={styles.textInput}
        placeholder='Password'
        onChangeText={text => setPasswordInput(text)}
        value={passwordInput}
      />
      <Button
        title='Signup'
        onPress={signup}
      />
      <Button
        title='or Login'
        onPress={SwitchLoginPage}
      />
    </View>
  );
}


const NotesPage = ({ navigation, route }) => {
  const [userInput, setUserInput] = useState("");
  const [userId] = useState(route?.params?.userId)
  const [values, loading, error] = useCollection(collection(database, userId))
  const data = values?.docs.map((doc) => ({...doc.data(), id: doc.id}))
  const [date, setDate] = useState(new Date());

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    console.log(currentDate)
    scheduleNotification(currentDate);
  };

  const scheduleNotification = async (date) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Note Reminder!",
        body: userInput, 
      },
      trigger: date,
    });
  };
  
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Notification access denied!');
        return;
      }
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    }
    
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    const updatedNote = route?.params?.updatedNote;
    if (updatedNote) {
      const noteRef = doc(database, userId, updatedNote.id);
      updateDoc(noteRef, {
        text: updatedNote.text
      }).catch(error => {
        Alert.alert("Failed to update note!");
      });
      navigation.setParams({ updatedNote: null });
    }
  }, [navigation, route?.params]);
  
  async function saveNotes() {
    try {
      addDoc(collection(database, userId), {
        text: userInput
      })
    } catch (error) {
      Alert.alert("Failed to save notes!");
    }
  }

  function addNote() {
    if (userInput.trim().length <= 0) {
      Alert.alert("Please enter some text!");
    } else {
      saveNotes(); 
      setUserInput("");
    }
  }

  async function signout() {
    signOut(auth)
    navigation.navigate('Login');
  }

  function handleButton(note) {
    navigation.navigate('DetailsPage', { note, userId });
  }

  return (
    <View style={styles.container}>
       <View style={styles.main}>
        <Text style={styles.title}>Notebook App</Text>
        <Text>by Samim S.</Text>

        <View style={styles.iconContainer}>
        <TextInput placeholder="Insert note" onChangeText={text => setUserInput(text)} value={userInput} style={styles.textInput}/>
          <TouchableOpacity onPress={addNote} style={styles.iconButton}>
            <FontAwesome name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.iconContainer}>
          <DateTimePicker
            value={date}
            mode={'date'}
            is24Hour={true}
            onChange={onChange}
          />
          <DateTimePicker
            value={date}
            mode={'time'}
            is24Hour={true}
            onChange={onChange}
          />
        </View>

        <Button
          title='Sign out'
          style={styles.signoutButton}
          onPress={signout}
        />
      </View>
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <View style={styles.noteItem}>
            <Button
              style={styles.noteText}
              key={item.id}
              title={'• ' + (item.text.length > 30 ? item.text.substring(0, 30) + '...' :  item.text)}
              onPress={() => handleButton(item)} />
          </View>
        )}
        style={styles.noteList}
      />

    </View>
   
  );
}

const DetailsPage = ({ navigation, route }) => {
  const [images, setImages] = useState([]);
  const [editedMessage, setEditedMessage] = useState(route.params?.note.text);
  const [userId, setUserId] = useState(route?.params?.userId)

  useEffect(() => {
    getImages()
  }, [navigation, route?.params]);

  async function launchCamera() {
    try {
      const result = await ImagePicker.requestCameraPermissionsAsync()
      if(result.granted === false) {
        console.log("Camera access denied!")
      } else {
        ImagePicker.launchCameraAsync({

        }).then((response) => {
          const imageResult = response.assets[0].uri
          uploadImage(imageResult)
        })
      }
    } catch (error) {
      Alert.alert("Failed to launch camera");
    }
  }
// 
  const saveNote = () => {
    uploadImage()
    const updatedNote = { ...route.params.note, text: editedMessage };
    navigation.navigate('Notes', { updatedNote });
  };

  const deleteNote = async () => {
    const noteId = route.params.note.id;
    try {
      await deleteDoc(doc(database, userId, noteId));
      Alert.alert("Note deleted!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Failed to delete note");
    }
  }

  async function selectImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true
    })
    if(!result.canceled) {
      const imageResult = result.assets[0].uri
      uploadImage(imageResult)
    }
  }

  async function getImages() {
    const noteId = route.params?.note.id;
    const imagesRef = ref(storage, `${noteId}/`);
    try {
      const result = await listAll(imagesRef);
      const imageUrls = await Promise.all(result.items.map(item => getDownloadURL(item)));
      setImages(imageUrls);
    } catch (error) {
      console.log("Error fetching images:", error);
    }
  }

  async function uploadImage(imageUri) {
    const image = await fetch(imageUri)
    const blob = await image.blob();
    const noteId = route.params?.note.id;
    const newImageRef = ref(storage, `${noteId}/${Date.now()}`);
    try {
      await uploadBytes(newImageRef, blob);
      getImages();
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  }

  async function deleteImage(imageUri) {
    const imageRef = ref(storage, imageUri);
    try {
      await deleteObject(imageRef);
      getImages();
      Alert.alert("Image deleted");
    } catch (error) {
      Alert.alert("Failed to delete image");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Details</Text>
      <TextInput style={styles.editableMessage} multiline value={editedMessage} onChangeText={setEditedMessage} />
      <View style={styles.detailActions}>
        <TouchableOpacity style={styles.iconButton} onPress={saveNote}><FontAwesome name="save" size={24} color="white" /></TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={selectImage}><FontAwesome name="image" size={24} color="white" /></TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={launchCamera}><FontAwesome name="camera" size={24} color="white" /></TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={deleteNote}><FontAwesome name="trash" size={24} color="white" /></TouchableOpacity>
      </View>
      <ScrollView>
        {images.map((imageUri, index) => (
          <View key={index} style={styles.noteImagesContainer}>
            <Image source={{ uri: imageUri }} style={styles.noteImage} />
            <TouchableOpacity style={styles.iconButton} onPress={() => deleteImage(imageUri)}>
              <FontAwesome name="trash" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>    
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  main: {
    paddingTop: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    paddingTop: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  textInput: {
    margin: 20,
    height: 50,
    width: 250,
    borderRadius: 6,
    paddingHorizontal: 20,
    backgroundColor: '#e8e8e8',
  },
  noteList: {
    paddingTop: 20,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconButton: {
    borderRadius: 6,
    backgroundColor: '#2cabff',
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editableMessage: {
    backgroundColor: '#f6f6f6',
    borderWidth: 1,
    borderColor: '#2cabff',
    borderRadius: 4,
    margin: 10,
    padding: 10,
    minHeight: 100,
    marginBottom: 20,
  },
  noteImagesContainer: {
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  noteImage: {
    resizeMode: 'contain',
    margin: 10,
    width: 250,
    height: 200,
    borderRadius: 8,
  },
  signoutButton: {
    backgroundColor: '#2cabff',
    padding: 5,
    marginBottom: 30
  }
});
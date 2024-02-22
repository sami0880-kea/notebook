import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, Alert, Button } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { app, database } from './Firebase'
import { doc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="NotesPage">
        <Stack.Screen name="Notes" component={NotesPage} />
        <Stack.Screen name="DetailsPage" component={DetailsPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const NotesPage = ({ navigation, route }) => {
  const [userInput, setUserInput] = useState("");
  const [values, loading, error] = useCollection(collection(database, "notes"))
  const data = values?.docs.map((doc) => ({...doc.data(), id: doc.id}))
  
  useEffect(() => {
    const updatedNote = route?.params?.updatedNote;
    if (updatedNote) {
      const noteRef = doc(database, "notes", updatedNote.id);
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
      addDoc(collection(database, "notes"), {
        text: userInput
      })
    } catch (error) {
      Alert.alert("Failed to save notes!");
    }
  }

  async function clearNotes() {
    try {
      await AsyncStorage.removeItem("@notes");
    } catch (error) {
      Alert.alert("Failed to clear notes!");
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

  function handleButton(note) {
    navigation.navigate('DetailsPage', { note });
  }

  return (
    <View style={styles.container}>
       <View style={styles.main}>
        <Text style={styles.title}>Notebook App</Text>
        <Text>by Samim S.</Text>

        <View style={styles.iconContainer}>
        <TextInput
          placeholder="Insert note..."
          onChangeText={text => setUserInput(text)}
          value={userInput}
          style={styles.textInput}
        />
          <TouchableOpacity onPress={addNote} style={styles.iconButton}>
            <FontAwesome name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
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
  const [editedMessage, setEditedMessage] = useState(route.params?.note.text);

  const saveNote = () => {
    const updatedNote = { ...route.params.note, text: editedMessage };
    navigation.navigate('Notes', { updatedNote });
  };

  const deleteNote = async () => {
    const noteId = route.params.note.id;
    try {
      await deleteDoc(doc(database, "notes", noteId));
      Alert.alert("Note deleted!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Failed to delete note");
    }
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Details</Text>
      <TextInput
        style={styles.editableMessage}
        multiline
        value={editedMessage}
        onChangeText={setEditedMessage}
      />
      <View style={styles.detailActions}>
        <TouchableOpacity style={styles.iconButton} onPress={saveNote}><FontAwesome name="save" size={24} color="white" /></TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={deleteNote}><FontAwesome name="trash" size={24} color="white" /></TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  main: {
    paddingTop: 50,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    paddingTop: 30,
    textAlign: "center",
    fontWeight: 'bold',
  },
  textInput: {
    margin: 20,
    height: 50,
    width: 250,
    borderRadius: 6,
    paddingHorizontal: 20,
    backgroundColor: "#e8e8e8",
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
    backgroundColor: "#2cabff",
    padding: 12,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  editableMessage: {
    backgroundColor: "#f6f6f6",
    borderWidth: 1,
    borderColor: "#2cabff",
    borderRadius: 4,
    margin: 10,
    padding: 10,
    minHeight: 100,
    marginBottom: 20,
  },
});
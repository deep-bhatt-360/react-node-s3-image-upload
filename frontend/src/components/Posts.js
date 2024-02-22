import { Box, Button, CircularProgress, Flex, Link, SimpleGrid, Text, VStack, Select } from '@chakra-ui/react';
import { useState, useRef } from 'react';
import useMutation from '../hooks/useMutation';
import useQuery from '../hooks/useQuery';

const URL = '/files';

const ErrorText = ({ children, ...props }) => (
  <Text fontSize="lg" color="red.300" {...props}>
    {children}
  </Text>
);

const Posts = () => {
  const [refetch, setRefetch] = useState(0);
  const {
    mutate: uploadImage,
    isLoading: uploading,
    error: uploadError,
  } = useMutation({ url: URL });

  const {
    data: files = [],
    isLoading: filesLoading,
    error: fetchError,
  } = useQuery(URL, refetch);

  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // Store the selected file object
  const fileInputRef = useRef(null);

  const handleBrowse = () => {
    fileInputRef.current.click();
  };

  const handleChangeFile = e => {
    const file = e.target.files[0];
    if (file) {
      // Disallow only 'exe' files
      if (file.type === 'application/x-msdownload' || file.name.endsWith('.exe')) {
        setError('EXE files are not allowed');
        setSelectedFile(null); // Reset file selection
        return;
      }
      setError('');
      setSelectedFile(file); // Store the file object
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('No file selected for upload');
      return;
    }

    const form = new FormData();
    form.append('file', selectedFile);

    await uploadImage(form);
    setSelectedFile(null); // Reset file selection after upload
    setTimeout(() => {
      setRefetch(s => s + 1);
    }, 1000);
  };

  return (
    <VStack spacing={4} mt={6}>
      <Select placeholder='Select S3 Bucket'>
        <option value='filesuploadpoc'>Files Upload POC</option>
      </Select>      
      <input id="fileInput" type="file" hidden onChange={handleChangeFile} ref={fileInputRef} />
      <Button colorScheme="blue" variant="outline" onClick={handleBrowse}>
        Browse
      </Button>
      {selectedFile && (
        <Flex alignItems="center" w="100%">
          <Text fontSize="lg" color="grey" isTruncated>
            You've selected the file <Text fontSize="lg" color="tomato" isTruncated>{selectedFile.name}</Text>
          </Text>
        </Flex>
      )}
      <Button
        colorScheme="blue"
        variant="solid"
        onClick={handleUpload}
        isLoading={uploading}
        isDisabled={!selectedFile}
      >
        Upload
      </Button>

      {error && <ErrorText>{error}</ErrorText>}
      {uploadError && <ErrorText>{uploadError}</ErrorText>}

      <Box w="100%">
        <Text textAlign="left" mb={4}>
          Files
        </Text>
        {filesLoading && (
          <CircularProgress color="gray.600" trackColor="blue.300" isIndeterminate />
        )}
        {fetchError && <ErrorText>Failed to load files</ErrorText>}
        {!fetchError && files?.length === 0 && (
          <Text textAlign="left" fontSize="lg" color="gray.500">
            No files found
          </Text>
        )}

        <SimpleGrid columns={[1, 2, 3]} spacing={4}>
          {files?.length > 0 &&
            files.map(({ fileName, presignedUrl }) => (
              <Box key={fileName} p={2} shadow="md" borderWidth="1px">
                <Link href={presignedUrl} isExternal download>
                  {fileName}
                </Link>
              </Box>
            ))}
        </SimpleGrid>
      </Box>
    </VStack>
  );
};

export default Posts;

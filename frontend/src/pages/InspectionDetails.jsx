import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Title,
  Text,
  Grid,
  Col,
  Metric,
  Badge,
  Button,
  TextInput,
  Textarea,
} from '@tremor/react';
import { inspectionService } from '../services';
import userService from '../services/userService';
// Piece history view moved to dedicated pages; no longer used here

export default function InspectionDetails() {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInspection, setEditedInspection] = useState(null);
  const [inspectorName, setInspectorName] = useState('');
  const [validatorName, setValidatorName] = useState('');
  // No tabs; this page is focused on inspection details only

  const fetchInspectionDetails = useCallback(async () => {
    try {
      // Use inspectionService instead of direct fetch
      const data = await inspectionService.getInspectionById(id);
      setInspection(data);
      setEditedInspection(data);
    } catch (err) {
      setError(err.message || 'Failed to load inspection details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInspectionDetails();
  }, [fetchInspectionDetails]);

  // Fetch inspector and validator names
  useEffect(() => {
    if (inspection) {
      if (inspection.user_creation) {
        userService.getUserById(inspection.user_creation)
          .then(user => setInspectorName(user.first_name + ' ' + user.last_name))
          .catch(() => setInspectorName(inspection.user_creation));
      }
      if (inspection.user_validation) {
        userService.getUserById(inspection.user_validation)
          .then(user => setValidatorName(user.first_name + ' ' + user.last_name))
          .catch(() => setValidatorName(inspection.user_validation));
      }
    }
  }, [inspection]);

  const handleSaveChanges = async () => {
    setSaving(true);
    setError(null);
    
    try {
      // Use inspectionService instead of direct fetch
      const updatedInspection = await inspectionService.updateInspection(id, editedInspection);
      setInspection(updatedInspection);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update inspection');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedInspection(inspection);
    setIsEditing(false);
    setError(null);
  };

  // Only allow editing of non-validation fields
  const editableFields = [
    'name_piece', 'ref_piece', 'name_program', 'state', 'dents', 'corrosions', 'scratches', 'details', 'inspection_path'
  ];

  // Piece history removed from this page

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading inspection details...</div>
      </div>
    );
  }

  if (error && !inspection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Inspection not found</div>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-10 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
        <div className="flex items-center gap-4">
          <Title>Inspection Details</Title>
          <Badge color={
            inspection.inspection_status === 'VALIDATED' ? 'emerald' :
            inspection.inspection_status === 'REJECTED' ? 'red' :
            'yellow'
          }>
            {inspection.inspection_status}
          </Badge>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            Edit Inspection
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges}
              loading={saving}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      <>
          <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
            <Card>
              <Title>Piece</Title>
              {isEditing ? (
                <TextInput
                  value={editedInspection.name_piece || ''}
                  onChange={e => setEditedInspection({ ...editedInspection, name_piece: e.target.value })}
                  disabled={saving}
                />
              ) : (
                <Text className="mt-2">{inspection.name_piece}</Text>
              )}
            </Card>
            <Card>
              <Title>Reference</Title>
              {isEditing ? (
                <TextInput
                  value={editedInspection.ref_piece || ''}
                  onChange={e => setEditedInspection({ ...editedInspection, ref_piece: e.target.value })}
                  disabled={saving}
                />
              ) : (
                <Text className="mt-2">{inspection.ref_piece}</Text>
              )}
            </Card>
            <Card>
              <Title>Program</Title>
              {isEditing ? (
                <TextInput
                  value={editedInspection.name_program || ''}
                  onChange={e => setEditedInspection({ ...editedInspection, name_program: e.target.value })}
                  disabled={saving}
                />
              ) : (
                <Text className="mt-2">{inspection.name_program}</Text>
              )}
            </Card>
            <Card>
              <Title>State</Title>
              {isEditing ? (
                <select
                  className="w-full border rounded p-2 mt-2"
                  value={editedInspection.state || ''}
                  onChange={e => setEditedInspection({ ...editedInspection, state: e.target.value })}
                  disabled={saving}
                >
                  <option value="">Select state...</option>
                  <option value="Perfect">Perfect</option>
                  <option value="Almost perfect">Almost perfect</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Not good">Not good</option>
                  <option value="Really bad">Really bad</option>
                  <option value="Destroyed">Destroyed</option>
                </select>
              ) : (
                <Text className="mt-2">{inspection.state}</Text>
              )}
            </Card>
            <Card>
              <Title>Inspector</Title>
              <Text className="mt-2">{inspectorName}</Text>
            </Card>
            <Card>
              <Title>Date</Title>
              <Text className="mt-2">{new Date(inspection.inspection_date).toLocaleDateString()}</Text>
            </Card>
            <Card>
              <Title>Issues</Title>
              <div className="mt-2 flex flex-wrap gap-2">
                {isEditing ? (
                  <>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editedInspection.dents || false}
                        onChange={e => setEditedInspection({ ...editedInspection, dents: e.target.checked })}
                        disabled={saving}
                      />
                      <Text>Dents</Text>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editedInspection.corrosions || false}
                        onChange={e => setEditedInspection({ ...editedInspection, corrosions: e.target.checked })}
                        disabled={saving}
                      />
                      <Text>Corrosion</Text>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editedInspection.scratches || false}
                        onChange={e => setEditedInspection({ ...editedInspection, scratches: e.target.checked })}
                        disabled={saving}
                      />
                      <Text>Scratches</Text>
                    </label>
                  </>
                ) : (
                  <>
                    {inspection.dents && <Badge color="red">Dents</Badge>}
                    {inspection.corrosions && <Badge color="red">Corrosion</Badge>}
                    {inspection.scratches && <Badge color="red">Scratches</Badge>}
                    {!inspection.dents && !inspection.corrosions && !inspection.scratches && (
                      <Badge color="emerald">No Issues</Badge>
                    )}
                  </>
                )}
              </div>
            </Card>
            <Card>
              <Title>Validated By</Title>
              <Text className="mt-2">{validatorName}</Text>
            </Card>
            <Card>
              <Title>Validation Date</Title>
              <Text className="mt-2">{inspection.validation_date ? new Date(inspection.validation_date).toLocaleDateString() : '-'}</Text>
            </Card>
            <Card className="col-span-full">
              <Title>Details</Title>
              {isEditing ? (
                <Textarea
                  className="mt-2"
                  value={editedInspection.details || ''}
                  onChange={e => setEditedInspection({ ...editedInspection, details: e.target.value })}
                  rows={4}
                  disabled={saving}
                />
              ) : (
                <Text className="mt-2 whitespace-pre-wrap">{inspection.details || '-'}</Text>
              )}
            </Card>
            <Card className="col-span-full">
              <Title>Inspection Path</Title>
              {isEditing ? (
                <Textarea
                  className="mt-2"
                  value={editedInspection.inspection_path || ''}
                  onChange={e => setEditedInspection({ ...editedInspection, inspection_path: e.target.value })}
                  rows={2}
                  disabled={saving}
                />
              ) : (
                <Text className="mt-2 whitespace-pre-wrap">{inspection.inspection_path || '-'}</Text>
              )}
            </Card>
            {inspection.images && inspection.images.length > 0 && (
              <Card className="col-span-full">
                <Title>Images</Title>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {inspection.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Inspection ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </Card>
            )}
            {inspection && (
              <Card className="col-span-full">
                <Title>Technical Information</Title>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-xs">
                  <div>
                    <strong>Created by (user ID):</strong> {inspection.user_creation}
                  </div>
                  <div>
                    <strong>Creation date:</strong> {inspection.creation_date ? new Date(inspection.creation_date).toLocaleString() : '-'}
                  </div>
                  <div>
                    <strong>Last modified by (user ID):</strong> {inspection.user_modification}
                  </div>
                  <div>
                    <strong>Last modification date:</strong> {inspection.modification_date ? new Date(inspection.modification_date).toLocaleString() : '-'}
                  </div>
                </div>
              </Card>
            )}
          </Grid>
      </>
    </main>
  );
}